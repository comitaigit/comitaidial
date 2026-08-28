import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  ActivityType,
  Call,
  CallOutcome,
  ParallelLegStatus,
  SignalCategory,
} from '@prisma/client';
import Twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { SuppressionService } from '../suppression/suppression.service';
import { TranscriptionService } from '../transcription/transcription.service';
import { DialerService } from '../dialer/dialer.service';
import { UpdateCallOutcomeDto } from './dto/update-call-outcome.dto';

// A call only counts as a real conversation once connected for >= 30s —
// see apps/backend/.claude/skills/outcome-definitions (founder's rule,
// 2026-08-20). Enforced here, not settable via the outcome picker.
const MIN_CONVERSATION_SECONDS = 30;

// Fixed at 3 for v1 — not yet a per-tenant setting (Dial spec, 2026-08-25).
const PARALLEL_LINES = 3;

export type ParallelBatchLeg = {
  callId: string;
  personId: string;
  name: string;
  accountName: string;
  phone: string;
};

export type ParallelBatchSummary = {
  batchId: string;
  conferenceName: string;
  legs: ParallelBatchLeg[];
};

export type ParallelBatchStatus = {
  batchId: string;
  legs: Array<{
    callId: string;
    personId: string;
    status: ParallelLegStatus;
  }>;
  winner: {
    callId: string;
    personId: string;
    name: string;
    role: string | null;
    accountId: string;
    accountName: string;
    clientCompanyId: string;
  } | null;
};

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

// Mirrors the frontend's OUTCOME_OPTIONS "retry" grouping (useOutcomeForm.ts)
// — these three keep the contact eligible to be dialed again, so they must
// NOT deactivate the cadence enrollment. Every other outcome (including
// INVALID_NUMBER) means the contact is done being worked in this cadence.
const RETRY_ELIGIBLE_OUTCOMES = new Set<CallOutcome>([
  CallOutcome.NO_ANSWER,
  CallOutcome.VOICEMAIL,
  CallOutcome.BUSY,
]);

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
  private readonly logger = new Logger(CallsService.name);
  private readonly client: Twilio.Twilio;
  private readonly fromNumber: string;
  private readonly anthropic: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly suppression: SuppressionService,
    private readonly transcription: TranscriptionService,
    private readonly dialer: DialerService,
  ) {
    this.client = Twilio(
      this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
      this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
    );
    this.fromNumber = this.config.getOrThrow<string>('TWILIO_PHONE_NUMBER');
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
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
    const fromIdentity = params.From ?? '';
    const userId = fromIdentity.startsWith('client:')
      ? fromIdentity.slice('client:'.length)
      : undefined;

    // Discagem paralela: the browser doesn't dial a number here at all — it
    // just parks itself in the batch's conference room and waits for
    // whichever outbound leg wins the AMD race to be redirected in. See
    // startParallelBatch/handleParallelLegAmd for the rest of the flow.
    if (params.mode === 'parallel' && params.batchId) {
      return this.handleParallelVoiceWebhook(params.batchId, userId);
    }

    const to = params.To;
    const personId = params.personId || null;

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
    //
    // answerOnBridge="true" is load-bearing: without it, Twilio answers the
    // BROWSER's leg (and bills it, and fires the Voice SDK's "accept" event)
    // the instant <Dial> starts executing — i.e. while the prospect's phone
    // is still ringing, not when they actually pick up. That falsely early
    // "accept" is what the frontend uses to flip into "in-call" and start
    // both the connected-call timer (durationSeconds — the 30s/60s
    // conversation thresholds) and account research generation, so without
    // this attribute both were measuring/firing from ring-start instead of
    // from the real answer.
    const recordingCallbackUrl = `${this.config.getOrThrow<string>('PUBLIC_API_URL')}/v1/calls/recording-status`;
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${this.fromNumber}" answerOnBridge="true" record="record-from-answer" recordingStatusCallback="${escapeXml(recordingCallbackUrl)}" recordingStatusCallbackEvent="completed"><Number>${escapeXml(to)}</Number></Dial></Response>`;
  }

  // Twilio's recordingStatusCallback — fires once the <Dial>'s (single-line)
  // or <Conference>'s (parallel) recording is ready. @Public(), verified via
  // Twilio's request signature same as /voice. Persists the recording URL
  // and kicks off transcription fire-and-forget: a slow/failed transcription
  // must never hold up this webhook response.
  //
  // batchId is present only for a Conference recording callback (we put it
  // on the recordingStatusCallback URL ourselves as a query param) — Twilio
  // doesn't send a CallSid for those, since the recording merges every
  // participant's audio rather than belonging to one leg.
  async handleRecordingStatus(
    params: Record<string, string>,
    batchId?: string,
  ): Promise<void> {
    const recordingUrl = params.RecordingUrl;
    const status = params.RecordingStatus;
    if (!recordingUrl || status !== 'completed') return;

    const call = batchId
      ? await this.prisma.call.findFirst({
          where: {
            dialBatchId: batchId,
            parallelLegStatus: ParallelLegStatus.CONNECTED,
          },
        })
      : params.CallSid
        ? await this.prisma.call.findUnique({
            where: { twilioCallSid: params.CallSid },
          })
        : null;
    if (!call) return;

    await this.prisma.call.update({
      where: { id: call.id },
      data: { recordingUrl },
    });

    void this.transcription.transcribeCall(call.id, recordingUrl);
  }

  // --- Discagem paralela (v1: 3 linhas fixas, 2026-08-25) ---
  //
  // The browser never dials a number directly here — it parks in a
  // Conference room, and up to PARALLEL_LINES outbound legs are originated
  // server-side via the REST API, each with async AMD. Whichever leg's AMD
  // callback confirms a human first wins a compare-and-swap on
  // DialBatch.winnerCallSid and gets redirected into the same room; every
  // other leg is hung up (or was already a machine/no-answer/busy).

  private conferenceJoinTwiml(
    conferenceName: string,
    isInitiator: boolean,
    recordingCallbackUrl?: string,
  ): string {
    const attrs = [
      `startConferenceOnEnter="${isInitiator}"`,
      `endConferenceOnExit="${isInitiator}"`,
      'beep="false"',
    ];
    if (isInitiator && recordingCallbackUrl) {
      attrs.push('record="record-from-start"');
      attrs.push(
        `recordingStatusCallback="${escapeXml(recordingCallbackUrl)}"`,
      );
      attrs.push('recordingStatusCallbackEvent="completed"');
    }
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Conference ${attrs.join(' ')}>${escapeXml(conferenceName)}</Conference></Dial></Response>`;
  }

  // The BDR's own browser leg — parks in the room and, being the
  // initiator, starts/ends the conference and owns its recording.
  private async handleParallelVoiceWebhook(
    batchId: string,
    userId: string | undefined,
  ): Promise<string> {
    const batch = userId
      ? await this.prisma.dialBatch.findFirst({
          where: { id: batchId, user: { id: userId } },
        })
      : null;
    if (!batch) {
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR">Sessão inválida.</Say></Response>';
    }

    const recordingCallbackUrl = `${this.config.getOrThrow<string>('PUBLIC_API_URL')}/v1/calls/recording-status?batchId=${batchId}`;
    return this.conferenceJoinTwiml(
      batch.conferenceName,
      true,
      recordingCallbackUrl,
    );
  }

  // Picks up to PARALLEL_LINES next dialable people from the cadence's
  // queue and originates a call to each in parallel — record-before-visual
  // rule same as everywhere else: every leg is a persisted Call (+
  // Activity) before we tell Twilio to dial it.
  async startParallelBatch(
    cadenceId: string,
    userId: string,
    tenantId: string,
  ): Promise<ParallelBatchSummary> {
    const queue = await this.dialer.getQueue(tenantId, cadenceId);

    // Skip anyone already mid-flight in another still-open batch for this
    // cadence — otherwise clicking "Iniciar discagem" again before a batch
    // resolves could dial the same person on two lines at once.
    const inFlight = await this.prisma.call.findMany({
      where: {
        tenantId,
        dialBatch: { cadenceId },
        parallelLegStatus: ParallelLegStatus.RINGING,
      },
      select: { personId: true },
    });
    const inFlightIds = new Set(inFlight.map((c) => c.personId));
    const candidates = queue
      .filter((p) => !inFlightIds.has(p.personId))
      .slice(0, PARALLEL_LINES);

    if (candidates.length === 0) {
      return { batchId: '', conferenceName: '', legs: [] };
    }

    const batchId = randomUUID();
    const conferenceName = `batch-${batchId}`;
    await this.prisma.dialBatch.create({
      data: { id: batchId, tenantId, cadenceId, userId, conferenceName },
    });

    const publicApiUrl = this.config.getOrThrow<string>('PUBLIC_API_URL');
    const legs: ParallelBatchLeg[] = [];

    for (const person of candidates) {
      const call = await this.prisma.call.create({
        data: {
          tenantId,
          userId,
          personId: person.personId,
          toNumber: person.phone,
          fromNumber: this.fromNumber,
          dialBatchId: batchId,
          parallelLegStatus: ParallelLegStatus.RINGING,
        },
      });
      await this.prisma.activity.create({
        data: {
          type: ActivityType.CALL_PLACED,
          tenantId,
          personId: person.personId,
          userId,
          payload: { callId: call.id, dialBatchId: batchId, parallel: true },
        },
      });

      try {
        const twilioCall = await this.client.calls.create({
          to: person.phone,
          from: this.fromNumber,
          url: `${publicApiUrl}/v1/calls/parallel-leg?callId=${call.id}`,
          statusCallback: `${publicApiUrl}/v1/calls/parallel-leg-status?callId=${call.id}`,
          statusCallbackEvent: ['completed'],
          machineDetection: 'DetectMessageEnd',
          asyncAmd: 'true',
          asyncAmdStatusCallback: `${publicApiUrl}/v1/calls/parallel-leg-amd?callId=${call.id}`,
        });
        await this.prisma.call.update({
          where: { id: call.id },
          data: { twilioCallSid: twilioCall.sid },
        });
        legs.push({
          callId: call.id,
          personId: person.personId,
          name: person.name,
          accountName: person.accountName,
          phone: person.phone,
        });
      } catch (err) {
        this.logger.error(
          `Failed to originate parallel leg for call ${call.id}: ${err instanceof Error ? err.message : err}`,
        );
        await this.prisma.call.update({
          where: { id: call.id },
          data: { parallelLegStatus: ParallelLegStatus.FAILED },
        });
      }
    }

    return { batchId, conferenceName, legs };
  }

  // Polled by the frontend (no push/websocket in v1) while a batch is in
  // flight, so the Dialer can show each line's live status and — once a
  // winner exists — open the research card for that specific person.
  async getBatchStatus(
    batchId: string,
    tenantId: string,
  ): Promise<ParallelBatchStatus> {
    const calls = await this.prisma.call.findMany({
      where: { tenantId, dialBatchId: batchId },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            role: true,
            accountId: true,
            account: { select: { name: true } },
          },
        },
      },
    });
    if (calls.length === 0) throw new NotFoundException('Batch not found.');

    const winningCall = calls.find(
      (c) => c.parallelLegStatus === ParallelLegStatus.CONNECTED,
    );
    const batch = winningCall
      ? await this.prisma.dialBatch.findUnique({
          where: { id: batchId },
          include: { cadence: { select: { clientCompanyId: true } } },
        })
      : null;

    return {
      batchId,
      legs: calls.map((c) => ({
        callId: c.id,
        personId: c.personId as string,
        status: c.parallelLegStatus ?? ParallelLegStatus.RINGING,
      })),
      winner:
        winningCall && winningCall.person && batch?.cadence.clientCompanyId
          ? {
              callId: winningCall.id,
              personId: winningCall.person.id,
              name: winningCall.person.name,
              role: winningCall.person.role,
              accountId: winningCall.person.accountId,
              accountName: winningCall.person.account.name,
              clientCompanyId: batch.cadence.clientCompanyId,
            }
          : null,
    };
  }

  // Initial TwiML for an outbound leg — Twilio requests this once the call
  // is answered by anyone/anything, but AMD's verdict (human vs machine)
  // arrives separately and asynchronously a few seconds later via
  // handleParallelLegAmd. Just hold in silence until that redirects this
  // call somewhere real (a very safe upper bound — in practice AMD resolves
  // long before this pause would ever finish).
  handleParallelLegInitial(): string {
    return '<?xml version="1.0" encoding="UTF-8"?><Response><Pause length="600"/></Response>';
  }

  // AsyncAmdStatusCallback target — the actual race. @Public(), verified via
  // Twilio's request signature same as /voice.
  async handleParallelLegAmd(
    callId: string,
    params: Record<string, string>,
  ): Promise<void> {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { dialBatch: true },
    });
    if (!call || !call.dialBatch || !call.twilioCallSid) return;

    const answeredBy = params.AnsweredBy ?? 'unknown';
    if (answeredBy !== 'human') {
      // Machine, fax, or undetermined — never bridge an uncertain answer to
      // the BDR. Auto-classified VOICEMAIL: AMD already told us what
      // happened, no BDR judgment needed for this leg.
      await this.client
        .calls(call.twilioCallSid)
        .update({ status: 'completed' });
      await this.prisma.call.update({
        where: { id: callId },
        data: {
          parallelLegStatus: ParallelLegStatus.MACHINE_DETECTED,
          outcome: CallOutcome.VOICEMAIL,
        },
      });
      return;
    }

    // Compare-and-swap: only the leg that flips winnerCallSid from null
    // actually won the race, even if two AMD callbacks land at nearly the
    // same instant — Postgres serializes the two UPDATEs.
    const claim = await this.prisma.dialBatch.updateMany({
      where: { id: call.dialBatch.id, winnerCallSid: null },
      data: { winnerCallSid: call.twilioCallSid },
    });

    const publicApiUrl = this.config.getOrThrow<string>('PUBLIC_API_URL');
    if (claim.count === 1) {
      await this.client.calls(call.twilioCallSid).update({
        url: `${publicApiUrl}/v1/calls/parallel-leg-join?callId=${callId}`,
        method: 'POST',
      });
      await this.prisma.call.update({
        where: { id: callId },
        data: { parallelLegStatus: ParallelLegStatus.CONNECTED },
      });
    } else {
      await this.client
        .calls(call.twilioCallSid)
        .update({ status: 'completed' });
      await this.prisma.call.update({
        where: { id: callId },
        data: {
          parallelLegStatus: ParallelLegStatus.ABANDONED,
          abandonedByParallelDial: true,
        },
      });
    }
  }

  // TwiML the winning leg is redirected to once handleParallelLegAmd claims
  // it — joins the same room the BDR is already waiting in.
  async handleParallelLegJoin(callId: string): Promise<string> {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { dialBatch: true },
    });
    if (!call?.dialBatch) {
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Say language="pt-BR">Sessão inválida.</Say></Response>';
    }
    return this.conferenceJoinTwiml(call.dialBatch.conferenceName, false);
  }

  // General statusCallback for an outbound leg — only the terminal
  // non-answered states matter here (answered/machine outcomes are already
  // handled by handleParallelLegAmd). @Public(), verified via Twilio's
  // request signature same as /voice.
  async handleParallelLegStatus(
    callId: string,
    params: Record<string, string>,
  ): Promise<void> {
    const status = params.CallStatus;
    const outcomeByStatus: Partial<Record<string, CallOutcome>> = {
      busy: CallOutcome.BUSY,
      'no-answer': CallOutcome.NO_ANSWER,
      failed: CallOutcome.INVALID_NUMBER,
    };
    const outcome = status ? outcomeByStatus[status] : undefined;
    if (!outcome) return;

    const call = await this.prisma.call.findUnique({ where: { id: callId } });
    // Already resolved by the AMD callback (connected/abandoned/machine) —
    // don't overwrite a real outcome with a stale status event.
    if (
      !call ||
      call.outcome ||
      call.parallelLegStatus !== ParallelLegStatus.RINGING
    ) {
      return;
    }

    await this.prisma.call.update({
      where: { id: callId },
      data: {
        outcome,
        parallelLegStatus:
          status === 'busy'
            ? ParallelLegStatus.BUSY
            : status === 'no-answer'
              ? ParallelLegStatus.NO_ANSWER
              : ParallelLegStatus.FAILED,
      },
    });
  }

  // The BDR hung up before any line was answered by a human — cancel every
  // still-ringing leg via the REST API. Without this, an outbound leg that
  // gets answered after the BDR has already left would redirect into a
  // Conference whose initiator is gone (endConferenceOnExit ended it), so
  // Twilio would spin up a fresh, empty room for the prospect to sit in
  // silence. Legs already resolved (machine/busy/no-answer/connected) are
  // left untouched — only RINGING ones are live enough to need cancelling.
  async cancelBatch(batchId: string, tenantId: string): Promise<void> {
    const ringingLegs = await this.prisma.call.findMany({
      where: {
        tenantId,
        dialBatchId: batchId,
        parallelLegStatus: ParallelLegStatus.RINGING,
      },
    });

    for (const leg of ringingLegs) {
      if (!leg.twilioCallSid) continue;
      try {
        await this.client
          .calls(leg.twilioCallSid)
          .update({ status: 'completed' });
      } catch (err) {
        this.logger.error(
          `Failed to cancel parallel leg ${leg.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    // Outcome NO_ANSWER (not left null) so these legs get the exact same
    // retry-eligible treatment as a line that rang out on its own —
    // RETRY_ELIGIBLE_OUTCOMES keeps the enrollment active, and Call
    // Check/Overview/Meu Funil count it as a real not-connected attempt
    // instead of a call with no outcome at all.
    await this.prisma.call.updateMany({
      where: {
        tenantId,
        dialBatchId: batchId,
        parallelLegStatus: ParallelLegStatus.RINGING,
      },
      data: {
        parallelLegStatus: ParallelLegStatus.ABANDONED,
        outcome: CallOutcome.NO_ANSWER,
      },
    });
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

      // A final/invalid outcome means this contact is done being worked in
      // whichever cadence they were dialed under — deactivate that
      // enrollment so GET /dialer/queue (including on a page refresh)
      // stops bringing them back. Call has no direct cadenceId column;
      // every real dial now goes through a DialBatch (discagem paralela is
      // the only path the UI exposes), which does carry one. Retry-eligible
      // outcomes (NO_ANSWER/VOICEMAIL/BUSY) intentionally leave the
      // enrollment active — those contacts stay in the queue to be retried.
      if (
        updated.outcome &&
        updated.personId &&
        existing.dialBatchId &&
        !RETRY_ELIGIBLE_OUTCOMES.has(updated.outcome)
      ) {
        const dialBatch = await tx.dialBatch.findUnique({
          where: { id: existing.dialBatchId },
          select: { cadenceId: true },
        });
        if (dialBatch) {
          await tx.cadenceEnrollment.updateMany({
            where: {
              tenantId,
              cadenceId: dialBatch.cadenceId,
              personId: updated.personId,
            },
            data: { active: false },
          });
        }
      }

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
      let createdTaskId: string | undefined;
      if (
        updated.outcome === CallOutcome.CALLBACK_REQUESTED &&
        updated.personId &&
        updated.person &&
        dto.callbackDueAt &&
        dto.callbackChannel
      ) {
        const task = await tx.task.create({
          data: {
            tenantId,
            personId: updated.personId,
            accountId: updated.person.accountId,
            sourceCallId: updated.id,
            channel: dto.callbackChannel,
            dueAt: new Date(dto.callbackDueAt),
            // Starts as the BDR's raw note — see the DTO's comment on
            // callbackNotes for why it isn't AI-generated at this point
            // (no transcript exists yet). Overwritten below, fire-and-forget,
            // with an actual "Resumo da task via IA" per the Dial spec.
            summary: dto.callbackNotes,
          },
        });
        createdTaskId = task.id;
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

      return { updated, createdTaskId };
    });

    // AI Sales Coach feedback needs both the transcript (arrives async from
    // Deepgram, may already be there) and durationSeconds (just saved above)
    // — fire-and-forget, must never hold up the outcome response.
    if (call.updated.durationSeconds !== null) {
      void this.transcription.maybeGenerateFeedback(call.updated.id);
    }

    if (call.createdTaskId && dto.callbackNotes) {
      void this.generateTaskSummary(call.createdTaskId, dto.callbackNotes);
    }

    return call.updated;
  }

  // "Resumo da task via IA" (Dial spec, seção 5) — condenses the BDR's raw
  // callbackNotes into a short summary of what the prospect asked for.
  // Fire-and-forget from updateOutcome: the Task already exists with the raw
  // note as a fallback, so a slow/failed summary never blocks recording the
  // outcome.
  private async generateTaskSummary(
    taskId: string,
    callbackNotes: string,
  ): Promise<void> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-opus-5',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Resuma em UMA frase curta (máximo 20 palavras), em português, o que o prospect pediu nesta anotação de um BDR sobre um retorno de ligação. Sem aspas, sem markdown. Responda apenas com a frase.\n\nAnotação: ${callbackNotes}`,
          },
        ],
      });
      const textBlock = message.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      );
      const summary = textBlock?.text.trim();
      if (!summary) return;

      await this.prisma.task.update({
        where: { id: taskId },
        data: { summary },
      });
    } catch (err) {
      this.logger.error(
        `Task summary generation failed for task ${taskId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
