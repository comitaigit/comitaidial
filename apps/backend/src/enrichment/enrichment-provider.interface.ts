import { EnrichmentProviderName } from '@prisma/client';

export interface PersonEnrichmentInput {
  name: string;
  companyName: string;
  companyDomain?: string | null;
  linkedinUrl?: string | null;
}

export interface PersonEnrichmentResult {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
}

export interface AccountEnrichmentInput {
  name: string;
  domain?: string | null;
}

export interface AccountEnrichmentResult {
  domain?: string;
  segment?: string;
}

// One adapter per real provider (currently just Lusha). Kept as an
// interface from day one rather than deferred to a second provider,
// because EnrichmentService's credit/job-recording logic needs a stable
// shape to call regardless of which provider answers.
export interface EnrichmentProvider {
  readonly name: EnrichmentProviderName;
  enrichPerson(input: PersonEnrichmentInput): Promise<PersonEnrichmentResult>;
  enrichAccount(
    input: AccountEnrichmentInput,
  ): Promise<AccountEnrichmentResult>;
}

export const ENRICHMENT_PROVIDER = Symbol('ENRICHMENT_PROVIDER');
