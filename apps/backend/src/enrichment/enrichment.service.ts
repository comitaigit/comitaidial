import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrichmentJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ENRICHMENT_PROVIDER } from './enrichment-provider.interface';
import type { EnrichmentProvider } from './enrichment-provider.interface';

// Flat cost for now — revisit per-field pricing once a second provider (or
// Lusha's own per-field reveal pricing) makes a fixed cost inaccurate.
const CREDIT_COST_PER_SUCCESS = 1;

@Injectable()
export class EnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENRICHMENT_PROVIDER) private readonly provider: EnrichmentProvider,
  ) {}

  async getCreditBalance(tenantId: string): Promise<number> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { enrichmentCreditBalance: true },
    });
    return tenant.enrichmentCreditBalance;
  }

  async grantCredits(tenantId: string, credits: number): Promise<number> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { enrichmentCreditBalance: { increment: credits } },
      select: { enrichmentCreditBalance: true },
    });
    return tenant.enrichmentCreditBalance;
  }

  private async assertHasCredits(tenantId: string): Promise<void> {
    const balance = await this.getCreditBalance(tenantId);
    if (balance <= 0) {
      throw new HttpException(
        'Sem créditos de enriquecimento disponíveis.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async enrichPerson(personId: string, tenantId: string) {
    await this.assertHasCredits(tenantId);

    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
      include: { account: true },
    });
    if (!person) throw new NotFoundException('Person not found.');

    let status: EnrichmentJobStatus;
    let errorMessage: string | undefined;
    const updates: { email?: string; phone?: string; linkedinUrl?: string } =
      {};

    try {
      const result = await this.provider.enrichPerson({
        name: person.name,
        companyName: person.account.name,
        companyDomain: person.account.domain,
        linkedinUrl: person.linkedinUrl,
      });
      // Fill gaps only — never overwrite something a BDR already entered.
      if (!person.email && result.email) updates.email = result.email;
      if (!person.phone && result.phone) updates.phone = result.phone;
      if (!person.linkedinUrl && result.linkedinUrl) {
        updates.linkedinUrl = result.linkedinUrl;
      }
      status =
        Object.keys(updates).length > 0
          ? EnrichmentJobStatus.SUCCESS
          : EnrichmentJobStatus.NO_MATCH;
    } catch (err) {
      status = EnrichmentJobStatus.FAILED;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const fieldsFilled = Object.keys(updates);
    const creditsCharged =
      status === EnrichmentJobStatus.SUCCESS ? CREDIT_COST_PER_SUCCESS : 0;

    const [updatedPerson] = await this.prisma.$transaction([
      this.prisma.person.update({ where: { id: person.id }, data: updates }),
      this.prisma.enrichmentJob.create({
        data: {
          tenantId,
          personId: person.id,
          provider: this.provider.name,
          status,
          creditsCharged,
          fieldsFilled: fieldsFilled,
          errorMessage,
        },
      }),
      ...(creditsCharged > 0
        ? [
            this.prisma.tenant.update({
              where: { id: tenantId },
              data: { enrichmentCreditBalance: { decrement: creditsCharged } },
            }),
          ]
        : []),
    ]);

    return { person: updatedPerson, status, creditsCharged, fieldsFilled };
  }

  async enrichAccount(accountId: string, tenantId: string) {
    await this.assertHasCredits(tenantId);

    const account = await this.prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) throw new NotFoundException('Account not found.');

    let status: EnrichmentJobStatus;
    let errorMessage: string | undefined;
    const updates: { domain?: string; segment?: string } = {};

    try {
      const result = await this.provider.enrichAccount({
        name: account.name,
        domain: account.domain,
      });
      if (!account.domain && result.domain) {
        // domain is unique per tenant — a provider match that collides with
        // another account's domain is dropped rather than crashing the
        // update (e.g. two similarly-named prospects sharing a parent
        // company's domain).
        const collision = await this.prisma.account.findUnique({
          where: { tenantId_domain: { tenantId, domain: result.domain } },
          select: { id: true },
        });
        if (!collision) updates.domain = result.domain;
      }
      if (!account.segment && result.segment) updates.segment = result.segment;
      status =
        Object.keys(updates).length > 0
          ? EnrichmentJobStatus.SUCCESS
          : EnrichmentJobStatus.NO_MATCH;
    } catch (err) {
      status = EnrichmentJobStatus.FAILED;
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const fieldsFilled = Object.keys(updates);
    const creditsCharged =
      status === EnrichmentJobStatus.SUCCESS ? CREDIT_COST_PER_SUCCESS : 0;

    const [updatedAccount] = await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: account.id },
        data: updates,
      }),
      this.prisma.enrichmentJob.create({
        data: {
          tenantId,
          accountId: account.id,
          provider: this.provider.name,
          status,
          creditsCharged,
          fieldsFilled: fieldsFilled,
          errorMessage,
        },
      }),
      ...(creditsCharged > 0
        ? [
            this.prisma.tenant.update({
              where: { id: tenantId },
              data: { enrichmentCreditBalance: { decrement: creditsCharged } },
            }),
          ]
        : []),
    ]);

    return { account: updatedAccount, status, creditsCharged, fieldsFilled };
  }
}
