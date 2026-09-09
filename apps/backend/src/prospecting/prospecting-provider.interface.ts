import { EnrichmentProviderName } from '@prisma/client';

export interface ContactSearchInput {
  companyName: string;
  companyDomain?: string | null;
  /// ICP-fit job titles to search for — ClientCompany.targetRoles.
  targetRoles: string[];
}

export interface ContactSearchResult {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
}

export interface LookalikeCompaniesInput {
  /// 5-100 domains, per Lusha's lookalike API — ProspectingService
  /// validates this before ever calling the provider.
  seedDomains: string[];
  /// Domains to exclude from results (accounts we already have).
  excludeDomains: string[];
  limit: number;
}

export interface LookalikeCompanyResult {
  name: string;
  domain?: string;
  segment?: string;
}

// AI Prospecting variant A: find the right contact at an Account that
// already exists in Comitai — distinct from EnrichmentProvider, which
// fills gaps on a record we already have. Returns null on no match rather
// than throwing, so ProspectingService can tell "found nothing" apart
// from "the provider call itself failed".
//
// Variant B: discover new companies similar to a set of seed Accounts.
// Returns [] on no match, same reasoning.
export interface ProspectingProvider {
  readonly name: EnrichmentProviderName;
  searchContact(input: ContactSearchInput): Promise<ContactSearchResult | null>;
  findLookalikeCompanies(
    input: LookalikeCompaniesInput,
  ): Promise<LookalikeCompanyResult[]>;
}

export const PROSPECTING_PROVIDER = Symbol('PROSPECTING_PROVIDER');
