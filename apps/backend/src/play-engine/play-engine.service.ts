import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  ActionStatus,
  ActionType,
  ApprovalMode,
  CadenceStepType,
  Prisma,
  StepExecutionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { GmailService } from '../gmail/gmail.service';
import { RecordProspectEventDto } from './dto/record-prospect-event.dto';

// An email send is retried this many times (transient Gmail/network
// errors) before the Action is given up on as FAILED.
const MAX_SEND_ATTEMPTS = 3;

/// CadenceStepType values the engine can turn into a dispatchable Action.
/// Everything else (CALL, MANUAL_EMAIL, MANUAL_SMS, WHATSAPP_MESSAGE,
/// ACTION_ITEM) stays a human-executed step — the engine advances past
/// those immediately (nothing to automate) and leaves surfacing them to
/// the existing Dialer/Task UI, same as today.
const DISPATCHABLE_STEP_TYPES: Partial<Record<CadenceStepType, ActionType>> = {
  [CadenceStepType.AUTOMATIC_EMAIL]: ActionType.SEND_EMAIL,
  [CadenceStepType.LINKEDIN_CONNECTION_REQUEST]: ActionType.LINKEDIN_CONNECT,
  [CadenceStepType.LINKEDIN_MESSAGE]: ActionType.LINKEDIN_MESSAGE,
};

interface TriggerConfig {
  /// Fire this many days after the previous step (or enrollment, for the
  /// first step) completed. Mutually exclusive with onEvent in practice,
  /// though nothing enforces that here.
  afterDays?: number;
  /// Wait for a ProspectEvent with this eventType (matched to the same
  /// person) before becoming READY.
  onEvent?: string;
}

interface ActionConfig {
  /// True if the payload should be authored by AI, using `prompt` as the
  /// per-step instruction — see createAction/generateEmailContent.
  generateWithAI?: boolean;
  prompt?: string;
  /// Static payload for non-AI actions (e.g. a fixed connection note).
  static?: Record<string, unknown>;
}

interface EmailPayload {
  subject: string;
  body: string;
  [key: string]: unknown;
}

/// The Play Engine: a poll loop that turns a Cadence's steps from a
/// template a human reads into something that actually runs. It only ever
/// makes deterministic decisions (did the deadline pass? did the expected
/// event arrive?) — see schema.prisma's "Play Engine" section for the full
/// rationale. Each tick is intentionally a separate, idempotent pass so a
/// crash mid-tick just means the next poll picks up where it left off.
@Injectable()
export class PlayEngineService {
  private readonly logger = new Logger(PlayEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly gmail: GmailService,
  ) {}

  /// Entry point for anything outside the engine ("a lead's email bounced",
  /// "the LinkedIn extension saw an accepted invite") to tell the Play
  /// Engine something happened. Nothing consumes these yet in this session
  /// (AI Email / LinkedIn extension land in later build-order items) but
  /// the ingestion path is wired now so those items just call this.
  recordEvent(tenantId: string, dto: RecordProspectEventDto) {
    return this.prisma.prospectEvent.create({
      data: {
        tenantId,
        eventType: dto.eventType,
        personId: dto.personId,
        accountId: dto.accountId,
        source: dto.source,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        occurredAt: dto.occurredAt ?? new Date(),
      },
    });
  }

  /// One full pass of the engine. Split into phases rather than one big
  /// query so each is independently idempotent and easy to reason about;
  /// @Interval re-enters this every tick regardless of how the previous
  /// one finished.
  @Interval(30_000)
  async tick() {
    try {
      await this.seedInitialExecutions();
      await this.promoteScheduled();
      await this.promoteWaitingEvents();
      await this.executeReady();
      await this.dispatchEmailActions();
    } catch (err) {
      // A poll loop must never die from one bad row — log and let the next
      // tick retry whatever didn't commit.
      this.logger.error('Play Engine tick failed', err as Error);
    }
  }

  /// Every enrollment needs a StepExecution for its cadence's first step
  /// before anything else can happen. Doing this here (rather than in
  /// CadencesService.enroll) keeps enrollment decoupled from the engine —
  /// the engine is the only thing that ever creates/advances executions.
  private async seedInitialExecutions() {
    const enrollments = await this.prisma.cadenceEnrollment.findMany({
      where: { stepExecutions: { none: {} } },
      include: {
        cadence: { include: { steps: { orderBy: { order: 'asc' }, take: 1 } } },
      },
    });

    for (const enrollment of enrollments) {
      const firstStep = enrollment.cadence.steps[0];
      if (!firstStep) continue;
      await this.createExecutionForStep(
        enrollment.tenantId,
        enrollment.id,
        firstStep.id,
        (firstStep.triggerConfig as TriggerConfig | null) ?? {},
        enrollment.enrolledAt,
      );
    }
  }

  private async createExecutionForStep(
    tenantId: string,
    enrollmentId: string,
    cadenceStepId: string,
    trigger: TriggerConfig,
    relativeTo: Date,
  ) {
    if (trigger.onEvent) {
      await this.prisma.stepExecution.upsert({
        where: { enrollmentId_cadenceStepId: { enrollmentId, cadenceStepId } },
        update: {},
        create: {
          tenantId,
          enrollmentId,
          cadenceStepId,
          status: StepExecutionStatus.WAITING_EVENT,
          waitingForEvent: trigger.onEvent,
        },
      });
      return;
    }

    const scheduledFor = new Date(relativeTo);
    scheduledFor.setDate(scheduledFor.getDate() + (trigger.afterDays ?? 0));
    await this.prisma.stepExecution.upsert({
      where: { enrollmentId_cadenceStepId: { enrollmentId, cadenceStepId } },
      update: {},
      create: {
        tenantId,
        enrollmentId,
        cadenceStepId,
        status: StepExecutionStatus.PENDING,
        scheduledFor,
      },
    });
  }

  /// PENDING executions whose scheduledFor has passed become READY.
  private async promoteScheduled() {
    await this.prisma.stepExecution.updateMany({
      where: {
        status: StepExecutionStatus.PENDING,
        scheduledFor: { lte: new Date() },
      },
      data: { status: StepExecutionStatus.READY },
    });
  }

  /// WAITING_EVENT executions matched against an unprocessed ProspectEvent
  /// for the same person become READY. One event advances at most one
  /// execution — claimed via processedAt so a retried tick can't double-fire.
  private async promoteWaitingEvents() {
    const waiting = await this.prisma.stepExecution.findMany({
      where: { status: StepExecutionStatus.WAITING_EVENT },
      include: { enrollment: true },
    });

    for (const execution of waiting) {
      if (!execution.waitingForEvent) continue;
      const event = await this.prisma.prospectEvent.findFirst({
        where: {
          tenantId: execution.tenantId,
          personId: execution.enrollment.personId,
          eventType: execution.waitingForEvent,
          processedAt: null,
        },
        orderBy: { occurredAt: 'asc' },
      });
      if (!event) continue;

      await this.prisma.$transaction([
        this.prisma.prospectEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date() },
        }),
        this.prisma.stepExecution.update({
          where: { id: execution.id },
          data: { status: StepExecutionStatus.READY },
        }),
      ]);
    }
  }

  /// READY executions actually run: dispatchable step types produce an
  /// Action (gated by the cadence's approvalMode when AI-authored), other
  /// step types are left for a human and just marked DONE. Either way, the
  /// enrollment's next step gets its own StepExecution seeded.
  private async executeReady() {
    const ready = await this.prisma.stepExecution.findMany({
      where: { status: StepExecutionStatus.READY },
      include: {
        cadenceStep: true,
        enrollment: {
          include: {
            person: { include: { account: true } },
            cadence: {
              include: {
                steps: { orderBy: { order: 'asc' } },
                clientCompany: true,
              },
            },
          },
        },
      },
    });

    for (const execution of ready) {
      await this.prisma.stepExecution.update({
        where: { id: execution.id },
        data: { status: StepExecutionStatus.EXECUTING },
      });

      const actionType = DISPATCHABLE_STEP_TYPES[execution.cadenceStep.type];
      let outcome: Record<string, unknown>;

      if (actionType) {
        const action = await this.createAction(execution, actionType);
        outcome = { actionId: action.id, actionType };
      } else {
        outcome = { humanStep: true, stepType: execution.cadenceStep.type };
      }

      await this.prisma.stepExecution.update({
        where: { id: execution.id },
        data: {
          status: StepExecutionStatus.DONE,
          executedAt: new Date(),
          outcome: outcome as Prisma.InputJsonValue,
        },
      });

      await this.seedNextStep(
        execution.enrollment,
        execution.cadenceStep.order,
      );
    }
  }

  private async createAction(
    execution: Prisma.StepExecutionGetPayload<{
      include: {
        cadenceStep: true;
        enrollment: {
          include: {
            person: { include: { account: true } };
            cadence: { include: { clientCompany: true } };
          };
        };
      };
    }>,
    type: ActionType,
  ) {
    const config =
      (execution.cadenceStep.actionConfig as ActionConfig | null) ?? {};

    const payload: Record<string, unknown> =
      config.generateWithAI && type === ActionType.SEND_EMAIL
        ? await this.generateEmailContent(execution, config.prompt)
        : (config.static ?? {});

    const requiresApproval =
      !!config.generateWithAI &&
      execution.enrollment.cadence.approvalMode === ApprovalMode.MANUAL;

    return this.prisma.action.create({
      data: {
        tenantId: execution.tenantId,
        type,
        personId: execution.enrollment.personId,
        stepExecutionId: execution.id,
        status: requiresApproval
          ? ActionStatus.PENDING_APPROVAL
          : ActionStatus.PENDING,
        payload: payload as Prisma.InputJsonValue,
        idempotencyKey: execution.id,
      },
    });
  }

  // Authors the actual subject/body at Action-creation time (not at
  // dispatch) so a BDR reviewing a PENDING_APPROVAL action sees real
  // content, not a placeholder — see the ApprovalMode gate right above.
  private async generateEmailContent(
    execution: Prisma.StepExecutionGetPayload<{
      include: {
        enrollment: {
          include: {
            person: { include: { account: true } };
            cadence: { include: { clientCompany: true } };
          };
        };
      };
    }>,
    stepInstruction: string | undefined,
  ): Promise<EmailPayload> {
    const person = execution.enrollment.person;
    const account = person.account;
    const clientCompany = execution.enrollment.cadence.clientCompany;
    const productContext = clientCompany
      ? `${clientCompany.name}: ${clientCompany.mainProduct}.${
          clientCompany.positioning ? ` ${clientCompany.positioning}` : ''
        }`
      : 'Produto não configurado — escreva de forma genérica.';

    const prompt = `Você é um BDR de vendas B2B escrevendo um e-mail de prospecção outbound em português.

Produto sendo vendido: ${productContext}
Destinatário: ${person.name}${person.role ? `, cargo "${person.role}"` : ''}, na empresa "${account.name}".
Instrução para este e-mail específico: ${stepInstruction ?? 'Escreva um e-mail de abertura de prospecção, direto e curto, terminando com uma pergunta de baixo esforço para o destinatário responder.'}

Responda APENAS com um objeto JSON válido (sem markdown, sem texto fora do JSON), exatamente neste formato:
{"subject": "assunto curto, sem clickbait", "body": "corpo do e-mail em texto simples, sem markdown, no máximo 120 palavras"}`;

    const json = await this.ai.completeJson({ prompt, maxTokens: 600 });
    return {
      subject:
        typeof json.subject === 'string' ? json.subject : '(sem assunto)',
      body:
        typeof json.body === 'string'
          ? json.body
          : 'Não foi possível gerar o conteúdo deste e-mail.',
    };
  }

  // SEND_EMAIL Actions that cleared approval (or never needed it) get
  // dispatched here. Actions of other types are left alone until a later
  // build-order item adds their own dispatcher (LinkedIn connect/message).
  private async dispatchEmailActions() {
    const pending = await this.prisma.action.findMany({
      where: {
        status: ActionStatus.PENDING,
        type: ActionType.SEND_EMAIL,
        attempts: { lt: MAX_SEND_ATTEMPTS },
      },
      include: {
        person: true,
        stepExecution: { include: { enrollment: true } },
      },
    });

    for (const action of pending) {
      const to = action.person.email;
      const enrolledById = action.stepExecution?.enrollment.enrolledById;
      const payload = action.payload as Partial<EmailPayload> | null;

      if (!to || !enrolledById || !payload?.subject || !payload.body) {
        // Not transient — no email on file, or no BDR to send as, or no
        // content. Retrying won't fix any of these.
        await this.prisma.action.update({
          where: { id: action.id },
          data: {
            status: ActionStatus.FAILED,
            attempts: { increment: 1 },
            executedAt: new Date(),
          },
        });
        continue;
      }

      try {
        await this.gmail.sendEmail(
          enrolledById,
          to,
          payload.subject,
          payload.body,
        );
        await this.prisma.action.update({
          where: { id: action.id },
          data: {
            status: ActionStatus.SENT,
            executedAt: new Date(),
            attempts: { increment: 1 },
          },
        });
      } catch (err) {
        const attempts = action.attempts + 1;
        this.logger.error(
          `Email dispatch failed for action ${action.id} (attempt ${attempts}/${MAX_SEND_ATTEMPTS})`,
          err as Error,
        );
        await this.prisma.action.update({
          where: { id: action.id },
          data: {
            attempts: { increment: 1 },
            status:
              attempts >= MAX_SEND_ATTEMPTS
                ? ActionStatus.FAILED
                : ActionStatus.PENDING,
          },
        });
      }
    }
  }

  private async seedNextStep(
    enrollment: Prisma.CadenceEnrollmentGetPayload<{
      include: { cadence: { include: { steps: true } } };
    }>,
    completedOrder: number,
  ) {
    const nextStep = enrollment.cadence.steps.find(
      (step) => step.order === completedOrder + 1,
    );
    if (!nextStep) return;

    await this.createExecutionForStep(
      enrollment.tenantId,
      enrollment.id,
      nextStep.id,
      (nextStep.triggerConfig as TriggerConfig | null) ?? {},
      new Date(),
    );
  }
}
