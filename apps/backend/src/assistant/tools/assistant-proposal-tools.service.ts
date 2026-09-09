import { Injectable } from '@nestjs/common';
import { AssistantProposalType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AssistantProposalsService } from '../assistant-proposals.service';
import { ToolDefinition } from './tool.types';

// Proposal tools for the Assistant (build item 7). Unlike the read-only
// tools, these never perform their action directly — execute() only
// validates the input and writes a PENDING AssistantProposal row, which
// sits until a BDR explicitly approves or rejects it (see
// AssistantProposalsService.approve/reject). This holds regardless of any
// cadence's ApprovalMode — that setting only ever gated the Play Engine's
// unattended actions, never a human conversation.
@Injectable()
export class AssistantProposalToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proposals: AssistantProposalsService,
  ) {}

  getProposalTools(): ToolDefinition[] {
    return [
      this.enrollInCadenceTool(),
      this.sendEmailTool(),
      this.enrichPersonTool(),
    ];
  }

  private enrollInCadenceTool(): ToolDefinition {
    return {
      spec: {
        name: 'propose_enroll_in_cadence',
        description:
          'Propõe inscrever um contato (person) em uma cadência. NÃO inscreve diretamente — cria uma proposta que o BDR precisa confirmar na interface antes de qualquer coisa acontecer. Sempre avise o usuário que a proposta está aguardando confirmação dele.',
        input_schema: {
          type: 'object',
          properties: {
            personId: { type: 'string' },
            cadenceId: { type: 'string' },
          },
          required: ['personId', 'cadenceId'],
        },
      },
      execute: async (input, ctx) => {
        const { personId, cadenceId } = input as {
          personId: string;
          cadenceId: string;
        };
        const [person, cadence] = await Promise.all([
          this.prisma.person.findFirst({
            where: { id: personId, tenantId: ctx.tenantId },
            select: { id: true, name: true },
          }),
          this.prisma.cadence.findFirst({
            where: { id: cadenceId, tenantId: ctx.tenantId },
            select: { id: true, name: true, active: true },
          }),
        ]);
        if (!person) return { error: 'Person not found.' };
        if (!cadence) return { error: 'Cadence not found.' };
        if (!cadence.active) return { error: 'Cadence is not active.' };

        const proposal = await this.proposals.create(
          ctx.tenantId,
          ctx.conversationId,
          ctx.userId,
          AssistantProposalType.ENROLL_IN_CADENCE,
          { personId, cadenceId },
        );
        return {
          proposalId: proposal.id,
          status: 'pending_confirmation',
          summary: `Inscrever ${person.name} na cadência "${cadence.name}"`,
        };
      },
    };
  }

  private sendEmailTool(): ToolDefinition {
    return {
      spec: {
        name: 'propose_send_email',
        description:
          'Propõe enviar um e-mail a um contato (person), a partir do Gmail conectado do próprio BDR. NÃO envia diretamente — cria uma proposta que o BDR precisa confirmar na interface. Escreva o assunto e corpo do e-mail você mesmo, em português. Sempre avise o usuário que a proposta está aguardando confirmação dele.',
        input_schema: {
          type: 'object',
          properties: {
            personId: { type: 'string' },
            subject: { type: 'string' },
            body: { type: 'string' },
          },
          required: ['personId', 'subject', 'body'],
        },
      },
      execute: async (input, ctx) => {
        const { personId, subject, body } = input as {
          personId: string;
          subject: string;
          body: string;
        };
        const person = await this.prisma.person.findFirst({
          where: { id: personId, tenantId: ctx.tenantId },
          select: { id: true, name: true, email: true },
        });
        if (!person) return { error: 'Person not found.' };
        if (!person.email) {
          return { error: `${person.name} has no email on file.` };
        }

        const proposal = await this.proposals.create(
          ctx.tenantId,
          ctx.conversationId,
          ctx.userId,
          AssistantProposalType.SEND_EMAIL,
          { personId, subject, body },
        );
        return {
          proposalId: proposal.id,
          status: 'pending_confirmation',
          summary: `Enviar e-mail para ${person.name} <${person.email}>: "${subject}"`,
        };
      },
    };
  }

  private enrichPersonTool(): ToolDefinition {
    return {
      spec: {
        name: 'propose_enrich_person',
        description:
          'Propõe buscar dados de contato (email/telefone) de uma person via provider pago. NÃO executa diretamente — cria uma proposta que o BDR precisa confirmar, já que consome créditos. Sempre avise o usuário que a proposta está aguardando confirmação dele.',
        input_schema: {
          type: 'object',
          properties: {
            personId: { type: 'string' },
          },
          required: ['personId'],
        },
      },
      execute: async (input, ctx) => {
        const { personId } = input as { personId: string };
        const person = await this.prisma.person.findFirst({
          where: { id: personId, tenantId: ctx.tenantId },
          select: { id: true, name: true },
        });
        if (!person) return { error: 'Person not found.' };

        const proposal = await this.proposals.create(
          ctx.tenantId,
          ctx.conversationId,
          ctx.userId,
          AssistantProposalType.ENRICH_PERSON,
          { personId },
        );
        return {
          proposalId: proposal.id,
          status: 'pending_confirmation',
          summary: `Enriquecer dados de contato de ${person.name} (consome 1 crédito se encontrar algo novo)`,
        };
      },
    };
  }
}
