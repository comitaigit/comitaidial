import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrichmentService } from '../../enrichment/enrichment.service';
import { ToolDefinition } from './tool.types';

// Auto-executing, read-only tools for the Assistant (build item 6). None
// of these can change data — that's deliberate: a tool that could requires
// human confirmation regardless of the cadence's ApprovalMode, which is
// what build item 7 (proposal tools) adds. Every query here is tenant-
// scoped from ToolContext, never from the input the model provides.
@Injectable()
export class AssistantToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: EnrichmentService,
  ) {}

  getReadOnlyTools(): ToolDefinition[] {
    return [
      this.searchAccountsTool(),
      this.getAccountDetailsTool(),
      this.searchPeopleTool(),
      this.getPersonDetailsTool(),
      this.getCreditsTool(),
    ];
  }

  private searchAccountsTool(): ToolDefinition {
    return {
      spec: {
        name: 'search_accounts',
        description:
          'Busca empresas (accounts) pelo nome. Use antes de get_account_details quando você só tem o nome, não o id.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Nome ou parte do nome da empresa.',
            },
          },
          required: ['query'],
        },
      },
      execute: async (input, ctx) => {
        const { query } = input as { query: string };
        const accounts = await this.prisma.account.findMany({
          where: {
            tenantId: ctx.tenantId,
            name: { contains: query, mode: 'insensitive' },
          },
          take: 5,
          select: {
            id: true,
            name: true,
            domain: true,
            segment: true,
            priority: true,
            pain: true,
          },
        });
        return { accounts };
      },
    };
  }

  private getAccountDetailsTool(): ToolDefinition {
    return {
      spec: {
        name: 'get_account_details',
        description:
          'Retorna detalhes de uma empresa (account): dados básicos, contatos (people) e sinais/atividades recentes. Requer o accountId (use search_accounts primeiro se só tiver o nome).',
        input_schema: {
          type: 'object',
          properties: {
            accountId: { type: 'string' },
          },
          required: ['accountId'],
        },
      },
      execute: async (input, ctx) => {
        const { accountId } = input as { accountId: string };
        const account = await this.prisma.account.findFirst({
          where: { id: accountId, tenantId: ctx.tenantId },
          include: {
            people: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true,
                phone: true,
              },
              take: 10,
            },
          },
        });
        if (!account) return { error: 'Account not found.' };

        const recentSignals = await this.prisma.signal.findMany({
          where: { tenantId: ctx.tenantId, accountId },
          orderBy: { occurredAt: 'desc' },
          take: 5,
          select: { summary: true, occurredAt: true },
        });

        return { account, recentSignals };
      },
    };
  }

  private searchPeopleTool(): ToolDefinition {
    return {
      spec: {
        name: 'search_people',
        description:
          'Busca contatos (people) pelo nome, opcionalmente restrito a uma empresa. Use antes de get_person_details quando você só tem o nome.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Nome ou parte do nome do contato.',
            },
            accountId: {
              type: 'string',
              description: 'Opcional — restringe a busca a essa empresa.',
            },
          },
          required: ['query'],
        },
      },
      execute: async (input, ctx) => {
        const { query, accountId } = input as {
          query: string;
          accountId?: string;
        };
        const people = await this.prisma.person.findMany({
          where: {
            tenantId: ctx.tenantId,
            name: { contains: query, mode: 'insensitive' },
            ...(accountId ? { accountId } : {}),
          },
          take: 5,
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            phone: true,
            account: { select: { id: true, name: true } },
          },
        });
        return { people };
      },
    };
  }

  private getPersonDetailsTool(): ToolDefinition {
    return {
      spec: {
        name: 'get_person_details',
        description:
          'Retorna detalhes de um contato (person): dados básicos, empresa, histórico de ligações recentes e status de cadência. Requer o personId (use search_people primeiro se só tiver o nome).',
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
          include: { account: { select: { id: true, name: true } } },
        });
        if (!person) return { error: 'Person not found.' };

        const recentCalls = await this.prisma.call.findMany({
          where: { tenantId: ctx.tenantId, personId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { outcome: true, createdAt: true, durationSeconds: true },
        });

        const enrollments = await this.prisma.cadenceEnrollment.findMany({
          where: { tenantId: ctx.tenantId, personId },
          select: {
            active: true,
            currentStepOrder: true,
            cadence: { select: { name: true } },
          },
        });

        return { person, recentCalls, enrollments };
      },
    };
  }

  private getCreditsTool(): ToolDefinition {
    return {
      spec: {
        name: 'get_enrichment_credits',
        description:
          'Retorna o saldo atual de créditos de enriquecimento/prospecção (usados por Data Enrichment e AI Prospecting).',
        input_schema: { type: 'object', properties: {} },
      },
      execute: async (_input, ctx) => {
        const balance = await this.enrichment.getCreditBalance(ctx.tenantId);
        return { balance };
      },
    };
  }
}
