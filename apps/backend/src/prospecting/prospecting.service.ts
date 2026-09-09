import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ActivityType, EnrichmentJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EnrichmentService } from '../enrichment/enrichment.service';
import { PROSPECTING_PROVIDER } from './prospecting-provider.interface';
import type { ProspectingProvider } from './prospecting-provider.interface';

// Same flat cost as EnrichmentService's per-success charge — both draw
// from the same Tenant.enrichmentCreditBalance pool.
const CREDIT_COST_PER_SUCCESS = 1;

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
}
