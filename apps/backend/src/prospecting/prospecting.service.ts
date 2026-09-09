import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Account, ActivityType, EnrichmentJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EnrichmentService } from '../enrichment/enrichment.service';
import { PROSPECTING_PROVIDER } from './prospecting-provider.interface';
import type {
  LookalikeCompanyResult,
  ProspectingProvider,
} from './prospecting-provider.interface';

// Same flat cost as EnrichmentService's per-success charge — both draw
// from the same Tenant.enrichmentCreditBalance pool.
const CREDIT_COST_PER_SUCCESS = 1;

// Lusha's lookalike API requires 5-100 seed companies (there's no
// single-seed "find similar" shape) — see prospecting-provider.interface.ts.
const MIN_LOOKALIKE_SEEDS = 5;
const MAX_LOOKALIKE_SEEDS = 100;
// Our own cost guardrail — independent of how many Lusha could return,
// since credits charged equal Accounts actually created.
const MAX_NEW_ACCOUNTS_PER_RUN = 10;

@Injectable()
export class ProspectingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: EnrichmentService,
    @Inject(PROSPECTING_PROVIDER)
    private readonly provider: ProspectingProvider,
  ) {}

  // Finds the right contact (by ClientCompany.targetRoles) at an Account
  // that already exists in Comitai, and creates a Person from the result.
  // Gated on: the ICP question being answered (targetRoles configured) and
  // the tenant having credits — both checked before any provider call, so
  // a misconfigured cadence never silently burns spend.
  async findContact(
    accountId: string,
    clientCompanyId: string,
    tenantId: string,
    userId: string,
  ) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) {
      throw new BadRequestException('Account not found.');
    }

    const clientCompany = await this.prisma.clientCompany.findFirst({
      where: { id: clientCompanyId, tenantId },
    });
    if (!clientCompany) {
      throw new BadRequestException('Client company not found.');
    }
    if (clientCompany.targetRoles.length === 0) {
      throw new BadRequestException(
        'Configure os cargos-alvo (ICP) desta empresa-cliente antes de buscar contatos.',
      );
    }

    // Don't spend a credit re-finding someone we already have — a role
    // match (case-insensitive) against an existing Person at this Account
    // counts as "already prospected".
    const existingPeople = await this.prisma.person.findMany({
      where: { tenantId, accountId },
      select: { id: true, role: true },
    });
    const targetRolesLower = clientCompany.targetRoles.map((r) =>
      r.toLowerCase(),
    );
    const alreadyPresent = existingPeople.find(
      (p) => p.role && targetRolesLower.includes(p.role.toLowerCase()),
    );
    if (alreadyPresent) {
      return {
        person: await this.prisma.person.findUniqueOrThrow({
          where: { id: alreadyPresent.id },
        }),
        status: 'ALREADY_EXISTS' as const,
        creditsCharged: 0,
      };
    }

    await this.enrichment.assertHasCredits(tenantId);

    let status: EnrichmentJobStatus;
    let errorMessage: string | undefined;
    let found: Awaited<ReturnType<ProspectingProvider['searchContact']>> = null;

    try {
      found = await this.provider.searchContact({
        companyName: account.name,
        companyDomain: account.domain,
        targetRoles: clientCompany.targetRoles,
      });
      status = found
        ? EnrichmentJobStatus.SUCCESS
        : EnrichmentJobStatus.NO_MATCH;
    } catch (err) {
      status = EnrichmentJobStatus.FAILED;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const creditsCharged =
      status === EnrichmentJobStatus.SUCCESS ? CREDIT_COST_PER_SUCCESS : 0;

    const { person, job } = await this.prisma.$transaction(async (tx) => {
      const createdPerson =
        status === EnrichmentJobStatus.SUCCESS && found
          ? await tx.person.create({
              data: {
                tenantId,
                accountId,
                name: found.name,
                role: found.role || undefined,
                email: found.email,
                phone: found.phone,
                linkedinUrl: found.linkedinUrl,
              },
            })
          : null;

      const createdJob = await tx.prospectingJob.create({
        data: {
          tenantId,
          accountId,
          clientCompanyId,
          provider: this.provider.name,
          status,
          creditsCharged,
          personId: createdPerson?.id,
          errorMessage,
        },
      });

      if (creditsCharged > 0) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { enrichmentCreditBalance: { decrement: creditsCharged } },
        });
      }

      if (createdPerson) {
        await tx.activity.create({
          data: {
            type: ActivityType.PERSON_CREATED,
            tenantId,
            accountId,
            personId: createdPerson.id,
            userId,
            payload: { source: 'ai_prospecting', role: createdPerson.role },
          },
        });
      }

      return { person: createdPerson, job: createdJob };
    });

    return {
      person,
      status: job.status,
      creditsCharged: job.creditsCharged,
    };
  }

  // Discovers new Accounts similar to a BDR-chosen set of seed Accounts
  // (variant B). Unlike findContact, there's no per-search flat cost —
  // credits charged equal the number of new Accounts actually created,
  // capped at MAX_NEW_ACCOUNTS_PER_RUN and by the tenant's current balance
  // so one call can never push the balance deeply negative.
  async discoverAccounts(
    seedAccountIds: string[],
    tenantId: string,
    userId: string,
    limit: number,
  ) {
    const seedAccounts = await this.prisma.account.findMany({
      where: { id: { in: seedAccountIds }, tenantId, domain: { not: null } },
      select: { id: true, domain: true },
    });
    if (seedAccounts.length < MIN_LOOKALIKE_SEEDS) {
      throw new BadRequestException(
        `A busca por empresas parecidas exige pelo menos ${MIN_LOOKALIKE_SEEDS} accounts com domínio preenchido (encontradas: ${seedAccounts.length}).`,
      );
    }
    if (seedAccounts.length > MAX_LOOKALIKE_SEEDS) {
      throw new BadRequestException(
        `No máximo ${MAX_LOOKALIKE_SEEDS} accounts podem ser usadas como referência.`,
      );
    }

    const balance = await this.enrichment.getCreditBalance(tenantId);
    if (balance <= 0) {
      throw new BadRequestException(
        'Sem créditos de enriquecimento/prospecção disponíveis.',
      );
    }
    const cappedLimit = Math.min(limit, MAX_NEW_ACCOUNTS_PER_RUN, balance);

    const existingAccounts = await this.prisma.account.findMany({
      where: { tenantId, domain: { not: null } },
      select: { domain: true },
      take: 500,
    });
    const seedDomains = seedAccounts
      .map((a) => a.domain)
      .filter((d): d is string => !!d);
    const excludeDomains = existingAccounts
      .map((a) => a.domain)
      .filter((d): d is string => !!d);

    let status: EnrichmentJobStatus;
    let errorMessage: string | undefined;
    let results: LookalikeCompanyResult[] = [];

    try {
      results = await this.provider.findLookalikeCompanies({
        seedDomains,
        excludeDomains,
        limit: cappedLimit,
      });
      status =
        results.length > 0
          ? EnrichmentJobStatus.SUCCESS
          : EnrichmentJobStatus.NO_MATCH;
    } catch (err) {
      status = EnrichmentJobStatus.FAILED;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const { createdAccounts, job } = await this.prisma.$transaction(
      async (tx) => {
        const createdAccounts: Account[] = [];

        if (status === EnrichmentJobStatus.SUCCESS) {
          for (const result of results.slice(0, cappedLimit)) {
            // domain is our uniqueness key — a result without one can't be
            // safely deduped, so it's skipped rather than risking a
            // collision later.
            if (!result.domain) continue;
            const collision = await tx.account.findUnique({
              where: { tenantId_domain: { tenantId, domain: result.domain } },
            });
            if (collision) continue;

            const account = await tx.account.create({
              data: {
                tenantId,
                name: result.name || result.domain,
                domain: result.domain,
                segment: result.segment,
              },
            });
            createdAccounts.push(account);
            await tx.activity.create({
              data: {
                type: ActivityType.ACCOUNT_CREATED,
                tenantId,
                accountId: account.id,
                userId,
                payload: { source: 'ai_prospecting_lookalike' },
              },
            });
          }
        }

        // Re-derive from what was actually created, not the raw provider
        // result count — every candidate could have collided with an
        // Account we already have.
        const finalStatus =
          createdAccounts.length > 0
            ? EnrichmentJobStatus.SUCCESS
            : status === EnrichmentJobStatus.FAILED
              ? EnrichmentJobStatus.FAILED
              : EnrichmentJobStatus.NO_MATCH;
        const creditsCharged = createdAccounts.length;

        const job = await tx.accountDiscoveryJob.create({
          data: {
            tenantId,
            seedAccountIds: seedAccounts.map((a) => a.id),
            provider: this.provider.name,
            status: finalStatus,
            creditsCharged,
            createdAccountIds: createdAccounts.map((a) => a.id),
            errorMessage,
          },
        });

        if (creditsCharged > 0) {
          await tx.tenant.update({
            where: { id: tenantId },
            data: { enrichmentCreditBalance: { decrement: creditsCharged } },
          });
        }

        return { createdAccounts, job };
      },
    );

    return {
      accounts: createdAccounts,
      status: job.status,
      creditsCharged: job.creditsCharged,
    };
  }
}
