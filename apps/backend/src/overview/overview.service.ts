import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallOutcome } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

// Outcomes that mean "this prospect still needs another touch" — drives the
// real work queue below.
const FOLLOW_UP_OUTCOMES: CallOutcome[] = [
  CallOutcome.NO_ANSWER,
  CallOutcome.VOICEMAIL,
  CallOutcome.CALLBACK_SCHEDULED,
  CallOutcome.QUALIFIED_OBJECTION,
];

const INSIGHT_TTL_MS = 10 * 60 * 1000;

export type OverviewKpis = {
  attemptsToday: number;
  conversationsToday: number;
  signalsToday: number;
};

export type WorkQueueItem = {
  personId: string;
  name: string;
  role: string | null;
  accountName: string;
  lastOutcome: CallOutcome;
  lastCallAt: Date;
};

@Injectable()
export class OverviewService {
  private readonly anthropic: Anthropic;
  // Keyed by tenantId — each tenant's insight is generated from its own
  // data and must never leak into another tenant's cached response.
  private readonly insightCache = new Map<
    string,
    { text: string; expiresAt: number }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  private startOfToday(): Date {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }

  // Real KPIs only — no cost/abandonment here, since there's no real cost or
  // parallel-dial data source yet (see outcome-definitions skill for why
  // conversationsToday reads isConversation, not the raw outcome).
  async getKpis(tenantId: string): Promise<OverviewKpis> {
    const startOfToday = this.startOfToday();
    const [attemptsToday, conversationsToday, signalsToday] = await Promise.all(
      [
        this.prisma.call.count({
          where: { tenantId, createdAt: { gte: startOfToday } },
        }),
        this.prisma.call.count({
          where: {
            tenantId,
            createdAt: { gte: startOfToday },
            isConversation: true,
          },
        }),
        this.prisma.signal.count({
          where: { tenantId, occurredAt: { gte: startOfToday } },
        }),
      ],
    );
    return { attemptsToday, conversationsToday, signalsToday };
  }

  // Most recent call per prospect, limited to outcomes that need a follow-up
  // — a real "who to call next" queue instead of a curated mock.
  async getWorkQueue(tenantId: string, limit = 6): Promise<WorkQueueItem[]> {
    const calls = await this.prisma.call.findMany({
      where: {
        tenantId,
        personId: { not: null },
        outcome: { in: FOLLOW_UP_OUTCOMES },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { person: { include: { account: true } } },
    });

    const seen = new Set<string>();
    const items: WorkQueueItem[] = [];
    for (const call of calls) {
      if (!call.person || !call.outcome || seen.has(call.person.id)) continue;
      seen.add(call.person.id);
      items.push({
        personId: call.person.id,
        name: call.person.name,
        role: call.person.role,
        accountName: call.person.account.name,
        lastOutcome: call.outcome,
        lastCallAt: call.createdAt,
      });
      if (items.length >= limit) break;
    }
    return items;
  }

  async getSummary(tenantId: string): Promise<{
    kpis: OverviewKpis;
    workQueue: WorkQueueItem[];
  }> {
    const [kpis, workQueue] = await Promise.all([
      this.getKpis(tenantId),
      this.getWorkQueue(tenantId),
    ]);
    return { kpis, workQueue };
  }

  // One-sentence AI insight for the Overview header, generated from today's
  // real KPIs + the most recent engagement Signals. Cached per tenant for
  // INSIGHT_TTL_MS so refreshing the page doesn't re-bill the LLM every time.
  async getInsight(tenantId: string): Promise<{ insight: string }> {
    const cached = this.insightCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return { insight: cached.text };
    }

    const [kpis, recentSignals] = await Promise.all([
      this.getKpis(tenantId),
      this.prisma.signal.findMany({
        where: { tenantId },
        orderBy: { occurredAt: 'desc' },
        take: 5,
      }),
    ]);

    const signalLines = recentSignals.length
      ? recentSignals.map((s) => `- ${s.summary}`).join('\n')
      : '- Nenhum sinal de engajamento registrado ainda.';

    const prompt = `Dados de hoje da equipe de vendas:
- Tentativas de ligação: ${kpis.attemptsToday}
- Conversas reais (>=30s conectados): ${kpis.conversationsToday}
- Sinais de engajamento hoje: ${kpis.signalsToday}

Sinais de engajamento mais recentes:
${signalLines}

Escreva UMA frase curta em português (máximo 25 palavras), tom direto e útil para
um BDR, destacando o dado ou sinal mais relevante para a próxima ação. Sem
markdown, aspas ou emojis. Responda apenas com a frase.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    const insight =
      textBlock?.text.trim() ||
      'Sem dados suficientes hoje para gerar um insight.';

    this.insightCache.set(tenantId, {
      text: insight,
      expiresAt: Date.now() + INSIGHT_TTL_MS,
    });
    return { insight };
  }
}
