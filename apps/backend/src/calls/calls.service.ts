import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ActivityType,
  Call,
  CallOutcome,
  SignalCategory,
} from '@prisma/client';
import Twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { SuppressionService } from '../suppression/suppression.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { UpdateCallOutcomeDto } from './dto/update-call-outcome.dto';

// A call only counts as a real conversation once connected for >= 30s —
// see apps/backend/.claude/skills/outcome-definitions (founder's rule,
// 2026-08-20). Enforced here, not settable via the outcome picker.
const MIN_CONVERSATION_SECONDS = 30;

// Outcomes worth surfacing as an ENGAGEMENT signal on the account/person
// timeline, most notable first — an outcome update produces at most one of
// these (checked in this order), not one per matching condition.
const OUTCOME_SIGNAL: Partial<
  Record<CallOutcome, { subtype: string; summary: (name: string) => string }>
> = {
  MEETING_SCHEDULED: {
    subtype: 'meeting_scheduled',
    summary: (name) => `Reunião agendada com ${name} durante ligação.`,
  },
  CALLBACK_REQUESTED: {
    subtype: 'callback_requested',
    summary: (name) => `${name} solicitou retorno durante ligação.`,
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

@Injectable()
export class CallsService {
  private readonly client: Twilio.Twilio;
  private readonly fromNumber: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly suppression: SuppressionService,
    private readonly transcription: TranscriptionService,
  ) {
    this.client = Twilio(
      this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
      this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
    );
    this.fromNumber = this.config.getOrThrow<string>('TWILIO_PHONE_NUMBER');
  }

  findAll(tenantId: string, personId?: string) {
    return this.prisma.call.findMany({
      where: personId ? { tenantId, personId } : { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        person: {
          select: {
            id: true,
            name: true,
            account: { select: { id: true, name: true, priority: true } },
          },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const call = await this.prisma.call.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true } },
        person: {
          select: {
            id: true,
            name: true,
            account: { select: { id: true, name: true, priority: true } },
          },
        },
      },
    });
    if (!call) throw new NotFoundException('Call not found.');
    return call;
  }

  // Places a real outbound call that speaks a confirmation message, and
  // persists it as a Call (personId null — this is a credential/caller-ID
  // check, not tied to a prospect) before returning, same "record before
  // any visual change" rule as every other domain action.
  async placeTestCall(
    to: string,
    userId: string,
    tenantId: string,
  ): Promise<{ sid: string }> {
    const twilioCall = await this.client.calls.create({
      to,
      from: this.fromNumber,
      twiml:
        '<Response><Say language="pt-BR">Teste de chamada do Comitai Dialer realizado com sucesso.</Say></Response>',
    });

    await this.prisma.$transaction(async (tx) => {
      const call = await tx.call.create({
        data: {
          tenantId,
          userId,
          twilioCallSid: twilioCall.sid,
          toNumber: to,
          fromNumber: this.fromNumber,
        },
      });
      await tx.activity.create({
        data: {
          type: ActivityType.CALL_PLACED,
          tenantId,
          userId,
          payload: {
            callId: call.id,
            twilioCallSid: twilioCall.sid,
            test: true,
          },
        },
      });
    });

    return { sid: twilioCall.sid };
  }

  // Signs a short-lived Twilio Voice Access Token scoped to our TwiML App,
  // identity = our own userId, so the /calls/voice webhook can recover
  // "who placed this call" from the From=client:<userId> Twilio sends back.
  createVoiceAccessToken(userId: string): string {
    const AccessToken = Twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: this.config.getOrThrow<string>(
        'TWILIO_TWIML_APP_SID',
      ),
      incomingAllow: false,
    });

    const token = new AccessToken(
      this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
      this.config.getOrThrow<string>('TWILIO_API_KEY_SID'),
      this.config.getOrThrow<string>('TWILIO_API_KEY_SECRET'),
      { identity: userId, ttl: 3600 },
    );
    token.addGrant(voiceGrant);
    return token.toJwt();
  }

  // TwiML App's Voice URL points here. Twilio POSTs here the moment the
  // browser softphone calls device.connect({ params: { To, personId } }) —
  // this bridges the browser leg to the prospect's real phone via <Dial>,
  // and persists the Call (+ Activity) before responding, same "record
  // before any visual change" rule as every other domain action. This route
  // is @Public() (Twilio can't send our JWT), so the caller's tenant is
  // recovered from the userId embedded in the Voice Access Token's identity
  // (From=client:<userId>) — a Call can't be saved without one, since every
  // row now requires a tenantId.
  async handleVoiceWebhook(params: Record<string, string>): Promise<string> {
    const to = params.To;
    const personId = params.personId || null;
    const fromIdentity = params.From ?? '';
    const userId = fromIdentity.startsWith('client:')
      ? fromIdentity.slice('client:'.length)
      : undefined;

    if (!to) {
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR">Número de destino ausente.</Say></Response>';
    }

    if (await this.suppression.isSuppressed(to)) {
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR">Este número está na lista de não ligar mais.</Say></Response>';
    }

    const user = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { tenantId: true },
        })
      : null;

    if (!user) {
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR">Sessão inválida.</Say></Response>';
    }

    // The TwiML App Voice Request's own CallSid is the parent call that's
    // about to run <Dial> below — recording attaches to this call, and the
    // recordingStatusCallback later reports back this exact CallSid, so
    // storing it now is what lets handleRecordingStatus find this row.
    const twilioCallSid = params.CallSid || undefined;

    await this.prisma.$transaction(async (tx) => {
      const call = await tx.call.create({
        data: {
          tenantId: user.tenantId,
          userId,
          personId,
          twilioCallSid,
          toNumber: to,
          fromNumber: this.fromNumber,
        },
      });
      await tx.activity.create({
        data: {
          type: ActivityType.CALL_PLACED,
          tenantId: user.tenantId,
          personId,
          userId,
          payload: { callId: call.id },
        },
      });
    });

    // record="record-from-answer" records the whole bridged call once the
    // prospect answers; the recordingStatusCallback fires once Twilio has
    // finished processing it, which kicks off transcription — see
    // handleRecordingStatus.
    const recordingCallbackUrl = `${this.config.getOrThrow<string>('PUBLIC_API_URL')}/v1/calls/recording-status`;
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${this.fromNumber}" record="record-from-answer" recordingStatusCallback="${escapeXml(recordingCallbackUrl)}" recordingStatusCallbackEvent="completed"><Number>${escapeXml(to)}</Number></Dial></Response>`;
  }

  // Twilio's recordingStatusCallback — fires once the <Dial>'s recording is
  // ready. @Public(), verified via Twilio's request signature same as
  // /voice. Persists the recording URL and kicks off transcription
  // fire-and-forget: a slow/failed transcription must never hold up this
  // webhook response.
  async handleRecordingStatus(params: Record<string, string>): Promise<void> {
    const twilioCallSid = params.CallSid;
    const recordingUrl = params.RecordingUrl;
    const status = params.RecordingStatus;
    if (!twilioCallSid || !recordingUrl || status !== 'completed') return;

    const call = await this.prisma.call.findUnique({
      where: { twilioCallSid },
    });
    if (!call) return;

    await this.prisma.call.update({
      where: { id: call.id },
      data: { recordingUrl },
    });

    void this.transcription.transcribeCall(call.id, recordingUrl);
  }

  async updateOutcome(
    id: string,
    dto: UpdateCallOutcomeDto,
    userId: string,
    tenantId: string,
  ): Promise<Call> {
    const call = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.call.findFirst({ where: { id, tenantId } });
      if (!existing) throw new NotFoundException('Call not found.');

      const updated = await tx.call.update({
        where: { id },
        data: {
          outcome: dto.outcome,
          notInterestedReason: dto.notInterestedReason,
          durationSeconds: dto.durationSeconds,
          isConversation:
            dto.durationSeconds !== undefined
              ? dto.durationSeconds >= MIN_CONVERSATION_SECONDS
              : existing.isConversation,
        },
        include: { person: { select: { name: true, accountId: true } } },
      });
      await tx.activity.create({
        data: {
          type: ActivityType.OUTCOME_RECORDED,
          tenantId,
          personId: updated.personId,
          userId,
          payload: { callId: updated.id, outcome: updated.outcome },
        },
      });

      const signalTemplate = updated.outcome
        ? OUTCOME_SIGNAL[updated.outcome]
        : undefined;
      if (signalTemplate && updated.person) {
        await tx.signal.create({
          data: {
            tenantId,
            category: SignalCategory.ENGAGEMENT,
            subtype: signalTemplate.subtype,
            accountId: updated.person.accountId,
            personId: updated.personId,
            summary: signalTemplate.summary(updated.person.name),
            source: 'Ligação registrada no Dialer',
          },
        });
      }

      // "Solicitou retorno" creates a Task, which the Overview page's task
      // list surfaces. Only possible when the call is tied to a real
      // prospect (a /calls/test credential-check call has no personId).
      if (
        updated.outcome === CallOutcome.CALLBACK_REQUESTED &&
        updated.personId &&
        updated.person &&
        dto.callbackDueAt &&
        dto.callbackChannel
      ) {
        await tx.task.create({
          data: {
            tenantId,
            personId: updated.personId,
            accountId: updated.person.accountId,
            sourceCallId: updated.id,
            channel: dto.callbackChannel,
            dueAt: new Date(dto.callbackDueAt),
            // BDR-authored note, not an AI summary — see the DTO's comment
            // on callbackNotes for why.
            summary: dto.callbackNotes,
          },
        });
      }

      if (dto.suppressNumber) {
        await tx.suppressedNumber.upsert({
          where: { phoneNumber: updated.toNumber },
          create: {
            phoneNumber: updated.toNumber,
            suppressedByTenantId: tenantId,
            reason: 'Marcado no Dialer ao registrar outcome.',
          },
          update: {},
        });
      }

      return updated;
    });

    // AI Sales Coach feedback needs both the transcript (arrives async from
    // Deepgram, may already be there) and durationSeconds (just saved above)
    // — fire-and-forget, must never hold up the outcome response.
    if (call.durationSeconds !== null) {
      void this.transcription.maybeGenerateFeedback(call.id);
    }

    return call;
  }
}
