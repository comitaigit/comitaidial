import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrichmentProviderName } from '@prisma/client';
import {
  AccountEnrichmentInput,
  AccountEnrichmentResult,
  EnrichmentProvider,
  PersonEnrichmentInput,
  PersonEnrichmentResult,
} from '../enrichment-provider.interface';

const BASE_URL = 'https://api.lusha.com';

// [PRECISA SER VALIDADO] This sandbox has no working Lusha account (the
// connected demo credential returns "Account is not active") and
// docs.lusha.com is blocked by this environment's network egress proxy, so
// the exact request/response shape below could not be confirmed against a
// live call or Lusha's own reference before shipping this. It follows
// Lusha's v2 Enrich API as documented at the time of writing (POST
// /v2/person and /v2/company, `api_key` header, `data[].isSuccess` +
// nested contact/company object in the response) — same "best effort,
// flagged" approach already used for Deepgram's pt-BR support in
// transcription.service.ts. Confirm field names against a real API key
// and fix this file before enabling Data Enrichment in production.
@Injectable()
export class LushaProvider implements EnrichmentProvider {
  readonly name = EnrichmentProviderName.LUSHA;

  constructor(private readonly config: ConfigService) {}

  private headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      api_key: this.config.getOrThrow<string>('LUSHA_API_KEY'),
    };
  }

  async enrichPerson(
    input: PersonEnrichmentInput,
  ): Promise<PersonEnrichmentResult> {
    const body = {
      contacts: [
        input.linkedinUrl
          ? { linkedinUrl: input.linkedinUrl }
          : {
              fullName: input.name,
              companyName: input.companyName,
              companyDomain: input.companyDomain ?? undefined,
            },
      ],
      metadata: { revealEmails: true, revealPhones: true },
    };

    const response = await fetch(`${BASE_URL}/v2/person`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        `Lusha person enrich failed: HTTP ${response.status} ${await response.text()}`,
      );
    }

    const json = (await response.json()) as {
      data?: Array<{
        isSuccess?: boolean;
        data?: {
          emailAddresses?: Array<{ email?: string }>;
          phoneNumbers?: Array<{ internationalNumber?: string }>;
          linkedinUrl?: string;
        };
      }>;
    };

    const match = json.data?.[0];
    if (!match?.isSuccess || !match.data) return {};

    return {
      email: match.data.emailAddresses?.[0]?.email,
      phone: match.data.phoneNumbers?.[0]?.internationalNumber,
      linkedinUrl: match.data.linkedinUrl,
    };
  }

  async enrichAccount(
    input: AccountEnrichmentInput,
  ): Promise<AccountEnrichmentResult> {
    const body = {
      companies: [
        input.domain ? { domain: input.domain } : { name: input.name },
      ],
    };

    const response = await fetch(`${BASE_URL}/v2/company`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        `Lusha company enrich failed: HTTP ${response.status} ${await response.text()}`,
      );
    }

    const json = (await response.json()) as {
      data?: Array<{
        isSuccess?: boolean;
        data?: { domain?: string; mainIndustry?: string };
      }>;
    };

    const match = json.data?.[0];
    if (!match?.isSuccess || !match.data) return {};

    return {
      domain: match.data.domain,
      segment: match.data.mainIndustry,
    };
  }
}
