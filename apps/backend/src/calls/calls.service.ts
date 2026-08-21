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
  CALLBACK_SCHEDULED: {
    subtype: 'callback_scheduled',
    summary: (name) => `Callback agendado com ${name} durante ligação.`,
  },
  QUALIFIED_OBJECTION: {
    subtype: 'qualified_objection',
    summary: (name) => `Objeção qualificada levantada por ${name} na ligação.`,
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
  ) {
    this.client = Twilio(
      this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
      this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
    );
    this.fromNumber = this.config.getOrThrow<string>('TWILIO_PHONE_NUMBER');
  }

  findAll(personId?: string) {
    return this.prisma.call.findMany({
      where: personId ? { personId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { person: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    const call = await this.prisma.call.findUnique({
      where: { id },
      include: { person: { select: { id: true, name: true } } },
    });
    if (!call) throw new NotFoundException('Call not found.');
    return call;
  }

  // Places a real outbound call that speaks a confirmation message, and
  // persists it as a Call (personId null — this is a credential/caller-ID
  // check, not tied to a prospect) before returning, same "record before
  // any visual change" rule as every other domain action.
  async placeTestCall(to: string, userId: string): Promise<{ sid: string }> {
    const twilioCall = await this.client.calls.create({
      to,
      from: this.fromNumber,
      twiml:
        '<Response><Say language="pt-BR">Teste de chamada do Comitai Dialer realizado com sucesso.</Say></Response>',
    });

    await this.prisma.$transaction(async (tx) => {
      const call = await tx.call.create({
        data: {
          twilioCallSid: twilioCall.sid,
          toNumber: to,
          fromNumber: this.fromNumber,
        },
      });
      await tx.activity.create({
        data: {
          type: ActivityType.CALL_PLACED,
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
  // and persists the Call (+ Activity, when the caller's identity is
  // recoverable) before responding, same "record before any visual change"
  // rule as every other domain action.
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

    await this.prisma.$transaction(async (tx) => {
      const call = await tx.call.create({
        data: { personId, toNumber: to, fromNumber: this.fromNumber },
      });
      if (userId) {
        await tx.activity.create({
          data: {
            type: ActivityType.CALL_PLACED,
            personId,
            userId,
            payload: { callId: call.id },
          },
        });
      }
    });

    return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${this.fromNumber}"><Number>${escapeXml(to)}</Number></Dial></Response>`;
  }

  async updateOutcome(
    id: string,
    dto: UpdateCallOutcomeDto,
    userId: string,
  ): Promise<Call> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.call.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Call not found.');

      const call = await tx.call.update({
        where: { id },
        data: {
          outcome: dto.outcome,
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
          personId: call.personId,
          userId,
          payload: { callId: call.id, outcome: call.outcome },
        },
      });

      const signalTemplate = call.outcome
        ? OUTCOME_SIGNAL[call.outcome]
        : undefined;
      if (signalTemplate && call.person) {
        await tx.signal.create({
          data: {
            category: SignalCategory.ENGAGEMENT,
            subtype: signalTemplate.subtype,
            accountId: call.person.accountId,
            personId: call.personId,
            summary: signalTemplate.summary(call.person.name),
            source: 'Ligação registrada no Dialer',
          },
        });
      }

      return call;
    });
  }
}
