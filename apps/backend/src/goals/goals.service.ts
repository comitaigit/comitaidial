import { ForbiddenException, Injectable } from '@nestjs/common';
import { CallOutcome, Goal, GoalPeriod, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NOT_CONNECTED_OUTCOMES } from '../calls/outcome-status.util';
import { UpsertGoalDto } from './dto/upsert-goal.dto';

export type GoalReportFilters = {
  from?: Date;
  to?: Date;
  userId?: string;
  accountId?: string;
  outcome?: CallOutcome;
};

export type GoalReportRow = {
  userId: string;
  userName: string;
  target: {
    callsTarget: number;
    conversationsTarget: number;
    dialingMinutesTarget: number;
    conversationMinutesTarget: number;
    connectedCallsTarget: number;
  } | null;
  realized: {
    calls: number;
    conversations: number;
    dialingMinutes: number;
    conversationMinutes: number;
    connectedCalls: number;
    connectRate: number;
  };
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as the first day of the week.
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyGoal(
    tenantId: string,
    userId: string,
    period: GoalPeriod,
  ): Promise<Goal | null> {
    return this.prisma.goal.findUnique({
      where: { userId_period: { userId, period } },
    });
  }

  // BDR self-service upsert. "gestor tem prioridade em caso de conflito"
  // (Dial spec, seção 8): once an ADMIN has set this goal, a MEMBER can no
  // longer silently overwrite it here.
  async upsertOwnGoal(
    tenantId: string,
    userId: string,
    role: string,
    dto: UpsertGoalDto,
  ): Promise<Goal> {
    if (role !== Role.ADMIN) {
      const existing = await this.prisma.goal.findUnique({
        where: { userId_period: { userId, period: dto.period } },
      });
      if (existing && existing.setByRole === Role.ADMIN) {
        throw new ForbiddenException(
          'Esta meta foi definida por um gestor. Apenas um gestor pode alterá-la.',
        );
      }
    }
    return this.upsert(tenantId, userId, role, dto);
  }

  // Manager override — always wins regardless of who set it last.
  async upsertGoalForUser(
    tenantId: string,
    targetUserId: string,
    dto: UpsertGoalDto,
  ): Promise<Goal> {
    return this.upsert(tenantId, targetUserId, Role.ADMIN, dto);
  }

  private async upsert(
    tenantId: string,
    userId: string,
    role: string,
    dto: UpsertGoalDto,
  ): Promise<Goal> {
    return this.prisma.goal.upsert({
      where: { userId_period: { userId, period: dto.period } },
      create: {
        tenantId,
        userId,
        period: dto.period,
        callsTarget: dto.callsTarget,
        conversationsTarget: dto.conversationsTarget,
        dialingMinutesTarget: dto.dialingMinutesTarget,
        conversationMinutesTarget: dto.conversationMinutesTarget,
        connectedCallsTarget: dto.connectedCallsTarget,
        setByRole: role === Role.ADMIN ? Role.ADMIN : Role.MEMBER,
      },
      update: {
        callsTarget: dto.callsTarget,
        conversationsTarget: dto.conversationsTarget,
        dialingMinutesTarget: dto.dialingMinutesTarget,
        conversationMinutesTarget: dto.conversationMinutesTarget,
        connectedCallsTarget: dto.connectedCallsTarget,
        setByRole: role === Role.ADMIN ? Role.ADMIN : Role.MEMBER,
      },
    });
  }

  // KPI Targets (Dial spec, seção 6) — realized vs. target, per user, no
  // access restriction (every user sees the full team's report). Only
  // WEEKLY goals exist in the UI today, so realized defaults to the current
  // Mon-Sun week unless the "Data" filter overrides it.
  //
  // "Tempo discando"/"Tempo em conversas" are approximated from
  // durationSeconds (Twilio's connected-leg duration) — there's no separate
  // ring/dial-time signal from Twilio to measure literal "time spent
  // dialing" versus "time spent talking" beyond isConversation's cutoff.
  async getReport(
    tenantId: string,
    filters: GoalReportFilters,
  ): Promise<GoalReportRow[]> {
    const from = filters.from ?? startOfWeek(new Date());
    const to = filters.to ?? new Date();

    const users = await this.prisma.user.findMany({
      where: { tenantId, ...(filters.userId ? { id: filters.userId } : {}) },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const goals = await this.prisma.goal.findMany({
      where: {
        tenantId,
        period: GoalPeriod.WEEKLY,
        userId: { in: users.map((u) => u.id) },
      },
    });
    const goalByUserId = new Map(goals.map((g) => [g.userId, g]));

    return Promise.all(
      users.map(async (user) => {
        const callWhere = {
          tenantId,
          userId: user.id,
          createdAt: { gte: from, lte: to },
          ...(filters.accountId
            ? { person: { accountId: filters.accountId } }
            : {}),
          ...(filters.outcome ? { outcome: filters.outcome } : {}),
        };

        const [
          calls,
          conversations,
          notConnected,
          classified,
          durationAgg,
          conversationDurationAgg,
        ] = await Promise.all([
          this.prisma.call.count({ where: callWhere }),
          this.prisma.call.count({
            where: { ...callWhere, isConversation: true },
          }),
          this.prisma.call.count({
            where: {
              ...callWhere,
              outcome: { in: [...NOT_CONNECTED_OUTCOMES] },
            },
          }),
          this.prisma.call.count({
            where: { ...callWhere, outcome: { not: null } },
          }),
          this.prisma.call.aggregate({
            where: callWhere,
            _sum: { durationSeconds: true },
          }),
          this.prisma.call.aggregate({
            where: { ...callWhere, isConversation: true },
            _sum: { durationSeconds: true },
          }),
        ]);

        const connectedCalls = classified - notConnected;
        const goal = goalByUserId.get(user.id) ?? null;

        return {
          userId: user.id,
          userName: user.name,
          target: goal
            ? {
                callsTarget: goal.callsTarget,
                conversationsTarget: goal.conversationsTarget,
                dialingMinutesTarget: goal.dialingMinutesTarget,
                conversationMinutesTarget: goal.conversationMinutesTarget,
                connectedCallsTarget: goal.connectedCallsTarget,
              }
            : null,
          realized: {
            calls,
            conversations,
            dialingMinutes: Math.round(
              (durationAgg._sum.durationSeconds ?? 0) / 60,
            ),
            conversationMinutes: Math.round(
              (conversationDurationAgg._sum.durationSeconds ?? 0) / 60,
            ),
            connectedCalls,
            connectRate: calls > 0 ? connectedCalls / calls : 0,
          },
        };
      }),
    );
  }
}
