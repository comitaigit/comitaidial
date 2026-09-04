import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallOutcome, Prisma } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { NOT_CONNECTED_OUTCOMES } from '../calls/outcome-status.util';

const PILL_TTL_MS = 10 * 60 * 1000;

// Below this many classified calls in the window, there just isn't enough
// signal to summarize dores/objeções without the LLM making things up — see
// the Dial spec, seção 5, tarefa 2.
const PILL_MIN_CLASSIFIED_CALLS = 10;

export type OverviewWindowDays = 7 | 15 | 30;

export type OverviewKpis = {
  attempts: number;
  connected: number;
  conversations: number;
  meetingsScheduled: number;
  connectRate: number;
  conversationRate: number;
};

export type ContentPill =
  | { ready: false; classifiedCount: number }
  | {
      ready: true;
      painPoints: string[];
      objections: string[];
      recommendation: string;
    };

export type TaskListItem = {
  id: string;
  companyName: string;
  prospectName: string;
  dueAt: Date;
  summary: string | null;
};

@Injectable()
export class OverviewService {
  private readonly anthropic: Anthropic;
  // Keyed by `${tenantId}:${windowDays}` — each tenant/window combination's
  // pill is generated from its own data and must never leak into another's.
  private readonly pillCache = new Map<
    string,
    { pill: ContentPill; expiresAt: number }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  private windowStart(days: number): Date {
    const start = new Date();
    start.setDate(start.getDate() - days);
    return start;
  }

  // Real KPIs over a rolling window (7/15/30 days), per the Dial spec's
  // seção 5 tarefa 1. "Conectadas" reads the same Outcome-derived status as
  // Call Check/Meu Funil (deriveCallStatus's NOT_CONNECTED_OUTCOMES) — the
  // spec is explicit these formulas must match everywhere. "Conversas" uses
  // isConversation (>=30s connected), not a 60s cutoff — the founder's
  // 2026-08-20 rule takes precedence over this spec doc's 60s mention.
  async getKpis(
    tenantId: string,
    windowDays: OverviewWindowDays,
  ): Promise<OverviewKpis> {
    const since = this.windowStart(windowDays);
    const [attempts, notConnected, conversations, meetingsScheduled] =
      await Promise.all([
        this.prisma.call.count({
          where: { tenantId, createdAt: { gte: since } },
        }),
        this.prisma.call.count({
          where: {
            tenantId,
            createdAt: { gte: since },
            outcome: { in: [...NOT_CONNECTED_OUTCOMES] },
          },
        }),
        this.prisma.call.count({
          where: { tenantId, createdAt: { gte: since }, isConversation: true },
        }),
        this.prisma.call.count({
          where: {
            tenantId,
            createdAt: { gte: since },
            outcome: CallOutcome.MEETING_SCHEDULED,
          },
        }),
      ]);

    const classified = await this.prisma.call.count({
      where: { tenantId, createdAt: { gte: since }, outcome: { not: null } },
    });
    const connected = classified - notConnected;

    return {
      attempts,
      connected,
      conversations,
      meetingsScheduled,
      connectRate: attempts > 0 ? connected / attempts : 0,
      conversationRate: connected > 0 ? conversations / connected : 0,
    };
  }

  // Meu Funil (Dial spec, seção 7) — same stage definitions as getKpis
  // above (the spec explicitly warns to keep the formula identical between
  // the two screens), but scoped to one user ("Meu" = personal, not team).
  async getFunnel(
    tenantId: string,
    userId: string,
    windowDays: OverviewWindowDays,
  ): Promise<{
    attempts: number;
    connected: number;
    conversations: number;
    meetingsScheduled: number;
  }> {
    const since = this.windowStart(windowDays);
    const [attempts, notConnected, conversations, meetingsScheduled] =
      await Promise.all([
        this.prisma.call.count({
          where: { tenantId, userId, createdAt: { gte: since } },
        }),
        this.prisma.call.count({
          where: {
            tenantId,
            userId,
            createdAt: { gte: since },
            outcome: { in: [...NOT_CONNECTED_OUTCOMES] },
          },
        }),
        this.prisma.call.count({
          where: {
            tenantId,
            userId,
            createdAt: { gte: since },
            isConversation: true,
          },
        }),
        this.prisma.call.count({
          where: {
            tenantId,
            userId,
            createdAt: { gte: since },
            outcome: CallOutcome.MEETING_SCHEDULED,
          },
        }),
      ]);

    const classified = await this.prisma.call.count({
      where: {
        tenantId,
        userId,
        createdAt: { gte: since },
        outcome: { not: null },
      },
    });
    const connected = classified - notConnected;

    return { attempts, connected, conversations, meetingsScheduled };
  }

  // Pending callback Tasks (completedAt null), most urgent first — created
  // automatically when a Dialer call is classified "Solicitou retorno"
  // (see CallsService.updateOutcome). "Resumo da task via IA" is generated
  // asynchronously there too; this just reads whatever's there so far.
  async getTaskList(tenantId: string): Promise<TaskListItem[]> {
    const tasks = await this.prisma.task.findMany({
      where: { tenantId, completedAt: null },
      orderBy: { dueAt: 'asc' },
      include: {
        person: { select: { name: true } },
        account: { select: { name: true } },
      },
      take: 50,
    });
    return tasks.map((t) => ({
      id: t.id,
      companyName: t.account.name,
      prospectName: t.person.name,
      dueAt: t.dueAt,
      summary: t.summary,
    }));
  }

  // Top 3 dores, top 3 objeções, and a recommendation — generated from
  // recent AI Sales Coach feedback in the window. Gated at
  // PILL_MIN_CLASSIFIED_CALLS classified calls per the Dial spec, so the
  // LLM never fabricates patterns from too little data. Cached per
  // tenant+window for PILL_TTL_MS.
  async getContentPill(
    tenantId: string,
    windowDays: OverviewWindowDays,
  ): Promise<ContentPill> {
    const cacheKey = `${tenantId}:${windowDays}`;
    const cached = this.pillCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.pill;

    const since = this.windowStart(windowDays);
    const classifiedCount = await this.prisma.call.count({
      where: { tenantId, createdAt: { gte: since }, outcome: { not: null } },
    });

    if (classifiedCount < PILL_MIN_CLASSIFIED_CALLS) {
      const pill: ContentPill = { ready: false, classifiedCount };
      this.pillCache.set(cacheKey, {
        pill,
        expiresAt: Date.now() + PILL_TTL_MS,
      });
      return pill;
    }

    const feedbackCalls = await this.prisma.call.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
        aiFeedback: { not: Prisma.JsonNull },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { aiFeedback: true },
    });

    const pill = await this.generatePill(feedbackCalls, classifiedCount);
    this.pillCache.set(cacheKey, { pill, expiresAt: Date.now() + PILL_TTL_MS });
    return pill;
  }

  private async generatePill(
    feedbackCalls: Array<{ aiFeedback: unknown }>,
    classifiedCount: number,
  ): Promise<ContentPill> {
    if (feedbackCalls.length === 0) {
      // Enough classified calls to clear the threshold, but none with AI
      // Sales Coach feedback yet (e.g. all short/unconnected calls) — there's
      // still nothing to summarize.
      return { ready: false, classifiedCount };
    }

    const feedbackText = feedbackCalls
      .map((c, i) => {
        const fb = c.aiFeedback as {
          context?: string;
          improvements?: string[];
        } | null;
        if (!fb) return '';
        return `Ligação ${i + 1}: ${fb.context ?? ''} Pontos a melhorar: ${(fb.improvements ?? []).join('; ')}`;
      })
      .filter(Boolean)
      .join('\n');

    const prompt = `Abaixo estão resumos de ligações de vendas B2B recentes, com contexto e pontos a melhorar identificados por um AI Sales Coach.

${feedbackText}

Analise o conjunto e responda em JSON, em português, neste formato exato:
{
  "painPoints": ["dor 1", "dor 2", "dor 3"],
  "objections": ["objeção 1", "objeção 2", "objeção 3"],
  "recommendation": "uma frase curta do que o time deve priorizar aprender/dominar"
}
"painPoints" = as principais dores dos prospects identificadas nas conversas, rankeadas da mais frequente para a menos frequente. "objections" = as objeções mais recorrentes levantadas pelos prospects. Responda apenas com o JSON.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    const json = extractJson(textBlock?.text?.trim() ?? '{}');

    return {
      ready: true,
      painPoints: Array.isArray(json.painPoints)
        ? json.painPoints.filter((v): v is string => typeof v === 'string')
        : [],
      objections: Array.isArray(json.objections)
        ? json.objections.filter((v): v is string => typeof v === 'string')
        : [],
      recommendation:
        typeof json.recommendation === 'string' ? json.recommendation : '',
    };
  }
}

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
