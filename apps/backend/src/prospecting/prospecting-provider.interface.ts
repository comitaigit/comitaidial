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

// AI Prospecting variant A: find the right contact at an Account that
// already exists in Comitai — distinct from EnrichmentProvider, which
// fills gaps on a record we already have. Returns null on no match rather
// than throwing, so ProspectingService can tell "found nothing" apart
// from "the provider call itself failed".
export interface ProspectingProvider {
  readonly name: EnrichmentProviderName;
  searchContact(input: ContactSearchInput): Promise<ContactSearchResult | null>;
}

export const PROSPECTING_PROVIDER = Symbol('PROSPECTING_PROVIDER');
