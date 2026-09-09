import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrichmentProviderName } from '@prisma/client';
import {
  ContactSearchInput,
  ContactSearchResult,
  LookalikeCompaniesInput,
  LookalikeCompanyResult,
  ProspectingProvider,
} from '../prospecting-provider.interface';

const BASE_URL = 'https://api.lusha.com';

// [PRECISA SER VALIDADO] Same caveat as LushaProvider (data enrichment):
// no working Lusha account and docs.lusha.com blocked from this sandbox,
// so this could not be confirmed against a live call. The two-step
// search-then-enrich shape (a search only returns a preview + an id;
// email/phone require a separate reveal call on that id) is corroborated
// by this project's own Lusha MCP connector tool descriptions
// (prospecting_contact_search → prospecting_contact_enrich), which are
// generated from Lusha's real OpenAPI spec — so that two-step shape is
// fairly trustworthy. The exact endpoint paths and field names below are
// not, and need confirming against a real API key before production use.
@Injectable()
export class LushaProspectingProvider implements ProspectingProvider {
  readonly name = EnrichmentProviderName.LUSHA;

  constructor(private readonly config: ConfigService) {}

  private headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      api_key: this.config.getOrThrow<string>('LUSHA_API_KEY'),
    };
  }

  async searchContact(
    input: ContactSearchInput,
  ): Promise<ContactSearchResult | null> {
    const searchBody = {
      filters: {
        contacts: { jobTitles: input.targetRoles },
        companies: input.companyDomain
          ? { companyDomains: [input.companyDomain] }
          : { companyNames: [input.companyName] },
      },
      pages: { page: 0, size: 1 },
    };

    const searchResponse = await fetch(
      `${BASE_URL}/prospecting/contact/search`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(searchBody),
      },
    );
    if (!searchResponse.ok) {
      throw new Error(
        `Lusha contact search failed: HTTP ${searchResponse.status} ${await searchResponse.text()}`,
      );
    }

    const searchJson = (await searchResponse.json()) as {
      results?: Array<{ id?: string; name?: string; jobTitle?: string }>;
    };
    const candidate = searchJson.results?.[0];
    if (!candidate?.id) return null;

    const enrichResponse = await fetch(
      `${BASE_URL}/prospecting/contact/enrich`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ ids: [candidate.id] }),
      },
    );
    if (!enrichResponse.ok) {
      throw new Error(
        `Lusha contact enrich failed: HTTP ${enrichResponse.status} ${await enrichResponse.text()}`,
      );
    }

    const enrichJson = (await enrichResponse.json()) as {
      data?: Array<{
        isSuccess?: boolean;
        data?: {
          emailAddresses?: Array<{ email?: string }>;
          phoneNumbers?: Array<{ internationalNumber?: string }>;
          linkedinUrl?: string;
        };
      }>;
    };
    const revealed = enrichJson.data?.[0];

    return {
      name: candidate.name ?? '',
      role: candidate.jobTitle ?? '',
      email: revealed?.data?.emailAddresses?.[0]?.email,
      phone: revealed?.data?.phoneNumbers?.[0]?.internationalNumber,
      linkedinUrl: revealed?.data?.linkedinUrl,
    };
  }

  // [PRECISA SER VALIDADO] Same caveat as searchContact above — the
  // requirement that Lusha's lookalike search needs 5-100 seed companies
  // (enforced in ProspectingService before this is ever called) is
  // corroborated by this project's own Lusha MCP connector tool
  // description; the exact endpoint path and response field names below
  // are not, and need confirming against a real API key.
  async findLookalikeCompanies(
    input: LookalikeCompaniesInput,
  ): Promise<LookalikeCompanyResult[]> {
    const body = {
      seeds: { domains: input.seedDomains },
      exclude: input.excludeDomains.length
        ? { domains: input.excludeDomains }
        : undefined,
      limit: input.limit,
    };

    const response = await fetch(`${BASE_URL}/prospecting/company/lookalike`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        `Lusha lookalike companies failed: HTTP ${response.status} ${await response.text()}`,
      );
    }

    const json = (await response.json()) as {
      results?: Array<{ name?: string; domain?: string; industry?: string }>;
    };

    return (json.results ?? []).map((r) => ({
      name: r.name ?? '',
      domain: r.domain,
      segment: r.industry,
    }));
  }
}
