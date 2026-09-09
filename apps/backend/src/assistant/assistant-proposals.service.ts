import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssistantProposal,
  AssistantProposalStatus,
  AssistantProposalType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CadencesService } from '../cadences/cadences.service';
import { GmailService } from '../gmail/gmail.service';
import { EnrichmentService } from '../enrichment/enrichment.service';

// Executes a proposal's actual side effect — called only from approve(),
// never from the tool that created the proposal. Each case mirrors what a
// BDR would have done by hand through the existing feature (Cadences,
// Gmail, Enrichment); this never invents a new write path of its own.
@Injectable()
export class AssistantProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cadences: CadencesService,
    private readonly gmail: GmailService,
    private readonly enrichment: EnrichmentService,
  ) {}

  create(
    tenantId: string,
    conversationId: string,
    userId: string,
    type: AssistantProposalType,
    payload: Record<string, unknown>,
  ): Promise<AssistantProposal> {
    return this.prisma.assistantProposal.create({
      data: {
        tenantId,
        conversationId,
        userId,
        type,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  listPending(tenantId: string, userId: string) {
    return this.prisma.assistantProposal.findMany({
      where: { tenantId, userId, status: AssistantProposalStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reject(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<AssistantProposal> {
    const proposal = await this.getOwnedPending(id, tenantId, userId);
    return this.prisma.assistantProposal.update({
      where: { id: proposal.id },
      data: {
        status: AssistantProposalStatus.REJECTED,
        resolvedAt: new Date(),
      },
    });
  }

  async approve(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<AssistantProposal> {
    const proposal = await this.getOwnedPending(id, tenantId, userId);

    try {
      const result = await this.execute(proposal, tenantId, userId);
      return this.prisma.assistantProposal.update({
        where: { id: proposal.id },
        data: {
          status: AssistantProposalStatus.EXECUTED,
          resolvedAt: new Date(),
          result: result as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.prisma.assistantProposal.update({
        where: { id: proposal.id },
        data: {
          status: AssistantProposalStatus.FAILED,
          resolvedAt: new Date(),
          result: { error: message },
        },
      });
    }
  }

  private async execute(
    proposal: AssistantProposal,
    tenantId: string,
    userId: string,
  ): Promise<Record<string, unknown>> {
    switch (proposal.type) {
      case AssistantProposalType.ENROLL_IN_CADENCE: {
        const { personId, cadenceId } = proposal.payload as {
          personId: string;
          cadenceId: string;
        };
        const enrollment = await this.cadences.enroll(
          cadenceId,
          { personId },
          userId,
          tenantId,
        );
        return { enrollmentId: enrollment.id };
      }
      case AssistantProposalType.SEND_EMAIL: {
        const { personId, subject, body } = proposal.payload as {
          personId: string;
          subject: string;
          body: string;
        };
        const person = await this.prisma.person.findFirst({
          where: { id: personId, tenantId },
        });
        if (!person) throw new Error('Person not found.');
        if (!person.email) throw new Error('Person has no email on file.');
        await this.gmail.sendEmail(userId, person.email, subject, body);
        return { sentTo: person.email };
      }
      case AssistantProposalType.ENRICH_PERSON: {
        const { personId } = proposal.payload as { personId: string };
        const result = await this.enrichment.enrichPerson(personId, tenantId);
        return { status: result.status, fieldsFilled: result.fieldsFilled };
      }
    }
  }

  private async getOwnedPending(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<AssistantProposal> {
    const proposal = await this.prisma.assistantProposal.findFirst({
      where: { id, tenantId, userId },
    });
    if (!proposal) throw new NotFoundException('Proposal not found.');
    if (proposal.status !== AssistantProposalStatus.PENDING) {
      throw new BadRequestException('Proposal already resolved.');
    }
    return proposal;
  }
}
