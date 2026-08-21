import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityType, Call } from '@prisma/client';
import Twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCallOutcomeDto } from './dto/update-call-outcome.dto';

// A call only counts as a real conversation once connected for >= 30s —
// see apps/backend/.claude/skills/outcome-definitions (founder's rule,
// 2026-08-20). Enforced here, not settable via the outcome picker.
const MIN_CONVERSATION_SECONDS = 30;

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
      });
      await tx.activity.create({
        data: {
          type: ActivityType.OUTCOME_RECORDED,
          personId: call.personId,
          userId,
          payload: { callId: call.id, outcome: call.outcome },
        },
      });
      return call;
    });
  }
}
