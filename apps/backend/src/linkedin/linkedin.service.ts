import { Injectable, NotFoundException } from '@nestjs/common';
import { ActionStatus, ActionType, SignalCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlayEngineService } from '../play-engine/play-engine.service';
import { ObserveProfileDto } from './dto/observe-profile.dto';

export type ObserveProfileResult =
  | { matched: false }
  | {
      matched: true;
      changed: false | 'role' | 'company';
      connectionJustAccepted: boolean;
    };

// Conservative daily caps per BDR — LinkedIn itself restricts accounts
// that connect/message too fast, and there's no way to detect that from
// here before it happens. Well under LinkedIn's own soft limits; the rest
// of the queue just waits for tomorrow rather than being lost.
const MAX_CONNECT_PER_DAY = 20;
const MAX_MESSAGE_PER_DAY = 20;

const LINKEDIN_ACTION_TYPES = [
  ActionType.LINKEDIN_CONNECT,
  ActionType.LINKEDIN_MESSAGE,
];

// LinkedIn's profile slug (the part after /in/) is that platform's actual
// stable identifier — matching on it is an exact match, not the fuzzy
// name/company matching this codebase deliberately avoids elsewhere
// (HubSpot, enrichment). Stored linkedinUrl values vary in protocol/www/
// trailing slash/query string, so a straight string-equality match would
// miss real matches; this doesn't need those normalized.
function extractProfileSlug(linkedinUrl: string): string | null {
  const match = /\/in\/([^/?]+)/i.exec(linkedinUrl);
  return match ? match[1] : null;
}

// LinkedIn as the source of truth for role/company (founder's rule,
// 2026-09) — validated automatically via the BDR's browser extension
// (apps/extension) rather than a human-mediated review step. A role
// change within the same company is safe to auto-apply; a company change
// is not (which Account would we move them to? it may not even exist in
// Comitai yet) — that case is only flagged via a Signal + ProspectEvent
// for the BDR to handle by hand, mirroring the "no fuzzy matching"
// caution used elsewhere (HubSpot, Enrichment).
//
// Also the read half of item 11 (LinkedIn action): there's no LinkedIn
// webhook for "they accepted your connection request", so the only signal
// this product ever gets is the extension later observing that the
// profile's connection degree became "1st" — see observeProfile below and
// PlayEngineService.seedNextStep's waitForConnectionAccepted handling.
@Injectable()
export class LinkedInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playEngine: PlayEngineService,
  ) {}

  async observeProfile(
    tenantId: string,
    dto: ObserveProfileDto,
  ): Promise<ObserveProfileResult> {
    const slug = extractProfileSlug(dto.linkedinUrl);
    if (!slug) return { matched: false };

    const person = await this.prisma.person.findFirst({
      where: {
        tenantId,
        linkedinUrl: { contains: slug, mode: 'insensitive' },
      },
      include: { account: { select: { id: true, name: true } } },
    });
    if (!person) return { matched: false };

    const connectionJustAccepted = await this.maybeRecordConnectionAccepted(
      tenantId,
      person.id,
      person.account.id,
      dto.connectionDegree,
    );

    const companyChanged =
      !!dto.currentCompanyName &&
      dto.currentCompanyName.trim().toLowerCase() !==
        person.account.name.trim().toLowerCase();

    if (companyChanged) {
      await this.recordSignal(
        tenantId,
        person.id,
        person.account.id,
        `${person.name} agora aparece no LinkedIn como fazendo parte de "${dto.currentCompanyName}", não mais "${person.account.name}".`,
      );
      await this.playEngine.recordEvent(tenantId, {
        eventType: 'linkedin.company_changed',
        source: 'linkedin_extension',
        personId: person.id,
        accountId: person.account.id,
        metadata: {
          previousCompany: person.account.name,
          newCompany: dto.currentCompanyName,
        },
      });
      return { matched: true, changed: 'company', connectionJustAccepted };
    }

    const roleChanged =
      !!dto.currentRole &&
      dto.currentRole.trim().toLowerCase() !==
        (person.role ?? '').trim().toLowerCase();

    if (roleChanged) {
      const previousRole = person.role;
      await this.prisma.person.update({
        where: { id: person.id },
        data: { role: dto.currentRole },
      });
      await this.recordSignal(
        tenantId,
        person.id,
        person.account.id,
        `${person.name} atualizou o cargo no LinkedIn${previousRole ? ` de "${previousRole}"` : ''} para "${dto.currentRole}".`,
      );
      await this.playEngine.recordEvent(tenantId, {
        eventType: 'linkedin.role_changed',
        source: 'linkedin_extension',
        personId: person.id,
        accountId: person.account.id,
        metadata: { previousRole, newRole: dto.currentRole },
      });
      return { matched: true, changed: 'role', connectionJustAccepted };
    }

    return { matched: true, changed: false, connectionJustAccepted };
  }

  // Returns true only the first time a "1st" degree is observed for this
  // person — deduped against ProspectEvent so revisiting an already-known
  // connection never re-fires the event or the extension's badge.
  private async maybeRecordConnectionAccepted(
    tenantId: string,
    personId: string,
    accountId: string,
    connectionDegree: string | undefined,
  ): Promise<boolean> {
    if (connectionDegree !== '1st') return false;

    const alreadyRecorded = await this.prisma.prospectEvent.findFirst({
      where: {
        tenantId,
        personId,
        eventType: 'linkedin.connection.accepted',
      },
      select: { id: true },
    });
    if (alreadyRecorded) return false;

    await this.playEngine.recordEvent(tenantId, {
      eventType: 'linkedin.connection.accepted',
      source: 'linkedin_extension',
      personId,
      accountId,
      metadata: {},
    });
    return true;
  }

  private recordSignal(
    tenantId: string,
    personId: string,
    accountId: string,
    summary: string,
  ) {
    return this.prisma.signal.create({
      data: {
        tenantId,
        category: SignalCategory.PERSON,
        subtype: 'job_change',
        personId,
        accountId,
        summary,
        source: 'Extensão do LinkedIn',
      },
    });
  }

  // --- LinkedIn action (item 11) ---
  // Unlike email (sent server-side via Gmail), a LinkedIn connect/message
  // is never automated end-to-end — that's browser automation of
  // LinkedIn's own UI, exactly the kind of thing that gets accounts
  // restricted. Instead, the extension surfaces the AI-drafted content and
  // the BDR clicks LinkedIn's native Connect/Message button themselves,
  // then confirms here.

  async getPendingActions(userId: string, tenantId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await this.prisma.action.groupBy({
      by: ['type'],
      where: {
        tenantId,
        type: { in: LINKEDIN_ACTION_TYPES },
        status: ActionStatus.SENT,
        executedAt: { gte: startOfDay },
        stepExecution: { enrollment: { enrolledById: userId } },
      },
      _count: true,
    });
    const sentCountByType = new Map(
      sentToday.map((row) => [row.type, row._count]),
    );

    const remainingConnect = Math.max(
      0,
      MAX_CONNECT_PER_DAY -
        (sentCountByType.get(ActionType.LINKEDIN_CONNECT) ?? 0),
    );
    const remainingMessage = Math.max(
      0,
      MAX_MESSAGE_PER_DAY -
        (sentCountByType.get(ActionType.LINKEDIN_MESSAGE) ?? 0),
    );

    const [connectActions, messageActions] = await Promise.all([
      remainingConnect > 0
        ? this.fetchPendingActions(
            tenantId,
            userId,
            ActionType.LINKEDIN_CONNECT,
            remainingConnect,
          )
        : [],
      remainingMessage > 0
        ? this.fetchPendingActions(
            tenantId,
            userId,
            ActionType.LINKEDIN_MESSAGE,
            remainingMessage,
          )
        : [],
    ]);

    return [...connectActions, ...messageActions];
  }

  private fetchPendingActions(
    tenantId: string,
    userId: string,
    type: ActionType,
    take: number,
  ) {
    return this.prisma.action.findMany({
      where: {
        tenantId,
        type,
        status: ActionStatus.PENDING,
        stepExecution: { enrollment: { enrolledById: userId } },
      },
      orderBy: { createdAt: 'asc' },
      take,
      include: {
        person: { select: { id: true, name: true, linkedinUrl: true } },
      },
    });
  }

  async completeAction(id: string, userId: string, tenantId: string) {
    const action = await this.getOwnedPendingAction(id, userId, tenantId);
    return this.prisma.action.update({
      where: { id: action.id },
      data: {
        status: ActionStatus.SENT,
        executedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  }

  async skipAction(id: string, userId: string, tenantId: string) {
    const action = await this.getOwnedPendingAction(id, userId, tenantId);
    return this.prisma.action.update({
      where: { id: action.id },
      data: { status: ActionStatus.CANCELLED, executedAt: new Date() },
    });
  }

  private async getOwnedPendingAction(
    id: string,
    userId: string,
    tenantId: string,
  ) {
    const action = await this.prisma.action.findFirst({
      where: {
        id,
        tenantId,
        type: { in: LINKEDIN_ACTION_TYPES },
        status: ActionStatus.PENDING,
        stepExecution: { enrollment: { enrolledById: userId } },
      },
    });
    if (!action) {
      throw new NotFoundException('Ação não encontrada ou já resolvida.');
    }
    return action;
  }
}
