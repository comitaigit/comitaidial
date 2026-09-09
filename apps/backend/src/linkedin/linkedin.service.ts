import { Injectable } from '@nestjs/common';
import { SignalCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlayEngineService } from '../play-engine/play-engine.service';
import { ObserveProfileDto } from './dto/observe-profile.dto';

export type ObserveProfileResult =
  | { matched: false }
  | { matched: true; changed: false }
  | { matched: true; changed: 'role' | 'company' };

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
// (separate deliverable, not part of this backend) rather than a human-
// mediated review step. A role change within the same company is safe to
// auto-apply; a company change is not (which Account would we move them
// to? it may not even exist in Comitai yet) — that case is only flagged
// via a Signal + ProspectEvent for the BDR to handle by hand, mirroring
// the "no fuzzy matching" caution used elsewhere (HubSpot, Enrichment).
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
      return { matched: true, changed: 'company' };
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
      return { matched: true, changed: 'role' };
    }

    return { matched: true, changed: false };
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
}
