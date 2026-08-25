import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountPriority, ClientCompany, InfluenceLevel } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { SuppressionService } from '../suppression/suppression.service';

export type QueueItem = {
  personId: string;
  name: string;
  phone: string;
  role: string | null;
  persona: InfluenceLevel | null;
  accountId: string;
  accountName: string;
  priority: AccountPriority | null;
  lastActivity: string | null;
  cadenceId: string;
  clientCompanyId: string;
};

export type ResearchObjection = { objection: string; response: string };
export type ResearchBattlecard = {
  competitor: string;
  theirStrength: string;
  ourEdge: string;
};

export type AccountResearchDto = {
  companyOverview: string;
  roleImportance: string;
  roleIndicators: string;
  callScript: string;
  objections: ResearchObjection[];
  battlecards: ResearchBattlecard[];
  generatedAt: string;
};

const PRIORITY_RANK: Record<AccountPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function extractJson(text: string): Record<string, unknown> {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  try {
    const parsed: unknown = JSON.parse(candidate);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

@Injectable()
export class DialerService {
  private readonly anthropic: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly suppression: SuppressionService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  // Dialable prospects enrolled in one cadence — phone required, suppressed
  // numbers excluded, ordered by account priority. Discagem paralela ainda
  // não existe: a fila é consumida um contato por vez pelo softphone.
  // A cadência precisa ter uma empresa/produto configurada (Workspace) antes
  // de poder ser discada — sem isso os cards de IA não teriam o que dizer,
  // e não existe mais fallback pro posicionamento fixo da Comitai
  // (2026-08-25).
  async getQueue(tenantId: string, cadenceId: string): Promise<QueueItem[]> {
    const cadence = await this.prisma.cadence.findFirst({
      where: { id: cadenceId, tenantId },
    });
    if (!cadence) throw new NotFoundException('Cadence not found.');
    if (!cadence.clientCompanyId) {
      throw new BadRequestException(
        'Configure a empresa/produto desta cadência no Workspace antes de discar.',
      );
    }

    const enrollments = await this.prisma.cadenceEnrollment.findMany({
      where: { cadenceId, tenantId, active: true },
      select: { personId: true, queuePosition: true },
    });
    const enrolledIds = enrollments.map((e) => e.personId);
    if (enrolledIds.length === 0) return [];
    const queuePositionByPerson = new Map(
      enrollments.map((e) => [e.personId, e.queuePosition]),
    );

    const people = await this.prisma.person.findMany({
      where: { tenantId, id: { in: enrolledIds }, phone: { not: null } },
      include: {
        account: { select: { id: true, name: true, priority: true } },
      },
    });
    if (people.length === 0) return [];

    const phones = people.map((p) => p.phone).filter((p): p is string => !!p);
    const suppressed = await this.suppression.suppressedNumbers(phones);
    const dialable = people.filter((p) => p.phone && !suppressed.has(p.phone));

    const personIds = dialable.map((p) => p.id);
    const recentSignals = personIds.length
      ? await this.prisma.signal.findMany({
          where: { tenantId, personId: { in: personIds } },
          orderBy: { occurredAt: 'desc' },
          select: { personId: true, summary: true },
        })
      : [];
    const lastActivityByPerson = new Map<string, string>();
    for (const signal of recentSignals) {
      if (signal.personId && !lastActivityByPerson.has(signal.personId)) {
        lastActivityByPerson.set(signal.personId, signal.summary);
      }
    }

    return dialable
      .map((p) => ({
        personId: p.id,
        name: p.name,
        phone: p.phone as string,
        role: p.role,
        persona: p.influenceLevel,
        accountId: p.account.id,
        accountName: p.account.name,
        priority: p.account.priority,
        lastActivity: lastActivityByPerson.get(p.id) ?? null,
        cadenceId: cadence.id,
        clientCompanyId: cadence.clientCompanyId as string,
      }))
      .sort((a, b) => {
        // Manual order (set by dragging in the Dialer) wins outright once
        // it exists — a row without a queuePosition sorts after every
        // positioned row, then everything left falls back to the original
        // priority-based default.
        const posA = queuePositionByPerson.get(a.personId) ?? null;
        const posB = queuePositionByPerson.get(b.personId) ?? null;
        if (posA !== null && posB !== null) return posA - posB;
        if (posA !== null) return -1;
        if (posB !== null) return 1;

        const rankA = a.priority ? PRIORITY_RANK[a.priority] : 3;
        const rankB = b.priority ? PRIORITY_RANK[b.priority] : 3;
        return rankA - rankB;
      });
  }

  // Persists a manual drag-and-drop reorder of the queue — the whole new
  // order is authoritative (same contract as reordering a playlist), so
  // every enrollment in this cadence gets renumbered to match, not just the
  // row that moved. A personId the client sent but that isn't (or is no
  // longer) an active enrollment here is silently skipped.
  async reorderQueue(
    tenantId: string,
    cadenceId: string,
    personIds: string[],
  ): Promise<void> {
    const cadence = await this.prisma.cadence.findFirst({
      where: { id: cadenceId, tenantId },
    });
    if (!cadence) throw new NotFoundException('Cadence not found.');

    const enrollments = await this.prisma.cadenceEnrollment.findMany({
      where: { cadenceId, tenantId, active: true },
      select: { id: true, personId: true },
    });
    const enrollmentIdByPerson = new Map(
      enrollments.map((e) => [e.personId, e.id]),
    );

    await this.prisma.$transaction(
      personIds
        .map((personId, index) => {
          const enrollmentId = enrollmentIdByPerson.get(personId);
          if (!enrollmentId) return null;
          return this.prisma.cadenceEnrollment.update({
            where: { id: enrollmentId },
            data: { queuePosition: index },
          });
        })
        .filter((op): op is NonNullable<typeof op> => op !== null),
    );
  }

  // Deep research for the account, generated once per (account, client
  // company) and cached — a callback reconnect reuses the same card instead
  // of re-billing the LLM, per the Dial spec's pré-call leve / pós-conexão
  // profunda cost-control rule. Keyed by clientCompanyId too (not just
  // accountId) since the same prospect account can be worked by cadences
  // selling different products — each needs its own framing.
  async getResearch(
    accountId: string,
    personRole: string | null,
    clientCompanyId: string,
    tenantId: string,
  ): Promise<AccountResearchDto> {
    const cached = await this.prisma.accountResearch.findFirst({
      where: { accountId, clientCompanyId, tenantId },
    });
    if (cached) return this.shapeResearch(cached);

    const account = await this.prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) throw new NotFoundException('Account not found.');

    const clientCompany = await this.prisma.clientCompany.findFirst({
      where: { id: clientCompanyId, tenantId },
    });
    if (!clientCompany) {
      throw new NotFoundException('Client company not found.');
    }

    const generated = await this.generateResearch(
      account.name,
      account.segment,
      personRole,
      clientCompany,
    );

    const saved = await this.prisma.accountResearch.upsert({
      where: { accountId_clientCompanyId: { accountId, clientCompanyId } },
      create: { tenantId, accountId, clientCompanyId, ...generated },
      update: { ...generated, generatedAt: new Date() },
    });

    return this.shapeResearch(saved);
  }

  private shapeResearch(row: {
    companyOverview: string;
    roleImportance: string;
    roleIndicators: string;
    callScript: string;
    objections: unknown;
    battlecards: unknown;
    generatedAt: Date;
  }): AccountResearchDto {
    return {
      companyOverview: row.companyOverview,
      roleImportance: row.roleImportance,
      roleIndicators: row.roleIndicators,
      callScript: row.callScript,
      objections: Array.isArray(row.objections)
        ? (row.objections as ResearchObjection[])
        : [],
      battlecards: Array.isArray(row.battlecards)
        ? (row.battlecards as ResearchBattlecard[])
        : [],
      generatedAt: row.generatedAt.toISOString(),
    };
  }

  private async generateResearch(
    accountName: string,
    segment: string | null,
    personRole: string | null,
    clientCompany: Pick<ClientCompany, 'name' | 'mainProduct' | 'positioning'>,
  ) {
    const productContext = `${clientCompany.name}: ${clientCompany.mainProduct}.${
      clientCompany.positioning ? ` ${clientCompany.positioning}` : ''
    }`;

    const prompt = `Você é um pesquisador de vendas B2B apoiando um BDR antes/durante uma ligação.

Contexto do produto sendo vendido nesta ligação: ${productContext}

Empresa prospectada: "${accountName}"${segment ? `, segmento "${segment}"` : ''}.
${personRole ? `Cargo do contato nesta ligação: "${personRole}".` : ''}

Responda APENAS com um objeto JSON válido (sem markdown, sem texto fora do JSON), exatamente neste formato:
{
  "companyOverview": "1-2 frases sobre o que a empresa provavelmente faz, com base no nome/segmento.",
  "roleImportance": "1-2 frases sobre por que esse cargo importa para a empresa.",
  "roleIndicators": "1-2 frases sobre indicadores típicos de um profissional nesse cargo e por que o produto sendo vendido importa para ele.",
  "callScript": "um roteiro curto de abertura de ligação (3-4 frases), em português, tom consultivo, não robótico.",
  "objections": [{"objection": "objeção comum em português", "response": "como responder"}],
  "battlecards": [{"competitor": "nome plausível de concorrente de ${clientCompany.mainProduct}", "theirStrength": "o que eles fazem bem", "ourEdge": "diferencial de ${clientCompany.name}"}]
}
"objections" deve ter 2-3 itens. "battlecards" deve ter até 3 itens.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    const json = extractJson(textBlock?.text?.trim() ?? '{}');

    return {
      companyOverview:
        typeof json.companyOverview === 'string'
          ? json.companyOverview
          : 'Não foi possível gerar esta seção.',
      roleImportance:
        typeof json.roleImportance === 'string'
          ? json.roleImportance
          : 'Não foi possível gerar esta seção.',
      roleIndicators:
        typeof json.roleIndicators === 'string'
          ? json.roleIndicators
          : 'Não foi possível gerar esta seção.',
      callScript: typeof json.callScript === 'string' ? json.callScript : '',
      objections: Array.isArray(json.objections) ? json.objections : [],
      battlecards: Array.isArray(json.battlecards) ? json.battlecards : [],
    };
  }
}
