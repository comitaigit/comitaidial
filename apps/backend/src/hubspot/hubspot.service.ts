import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';

const BASE_URL = 'https://api.hubapi.com';

// [PRECISA SER VALIDADO] Not tested against a real HubSpot account from
// this sandbox — but HubSpot's CRM API v3 has been stable and publicly
// documented for years (unlike Lusha's), so confidence here is higher.
// Confirm the exact property names below still match the target
// portal's defaults (custom HubSpot setups can rename/remove standard
// properties) before relying on this in production.
const CONTACT_PROPERTIES = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'jobtitle',
  'hs_lead_status',
  'lifecyclestage',
];
const COMPANY_PROPERTIES = [
  'name',
  'domain',
  'industry',
  'numberofemployees',
  'lifecyclestage',
];

export interface HubSpotObject {
  id: string;
  properties: Record<string, string | null>;
}

// One connection per tenant (HubSpot Private App token) — see
// schema.prisma's HubSpotConnection comment for why a token, not OAuth.
// Read-only: this never writes back to HubSpot.
@Injectable()
export class HubSpotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async connect(tenantId: string, accessToken: string): Promise<void> {
    // Validate before storing — a bad token should fail loudly here, not
    // silently on the tenant's first read days later.
    const response = await fetch(
      `${BASE_URL}/crm/v3/objects/contacts?limit=1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!response.ok) {
      throw new BadRequestException(
        'Token do HubSpot inválido — não foi possível autenticar.',
      );
    }

    const encryptedAccessToken = this.encryption.encrypt(accessToken);
    await this.prisma.hubSpotConnection.upsert({
      where: { tenantId },
      create: { tenantId, encryptedAccessToken },
      update: { encryptedAccessToken },
    });
  }

  async getStatus(tenantId: string): Promise<{ connected: boolean }> {
    const connection = await this.prisma.hubSpotConnection.findUnique({
      where: { tenantId },
    });
    return { connected: !!connection };
  }

  async disconnect(tenantId: string): Promise<void> {
    await this.prisma.hubSpotConnection.deleteMany({ where: { tenantId } });
  }

  private async getToken(tenantId: string): Promise<string> {
    const connection = await this.prisma.hubSpotConnection.findUnique({
      where: { tenantId },
    });
    if (!connection) {
      throw new BadRequestException(
        'HubSpot não está conectado para este tenant.',
      );
    }
    return this.encryption.decrypt(connection.encryptedAccessToken);
  }

  private async fetchObject(
    tenantId: string,
    objectType: 'contacts' | 'companies',
    id: string,
    properties: string[],
  ): Promise<HubSpotObject> {
    const token = await this.getToken(tenantId);
    const url = `${BASE_URL}/crm/v3/objects/${objectType}/${encodeURIComponent(id)}?properties=${properties.join(',')}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 404) {
      throw new NotFoundException(
        `HubSpot ${objectType.slice(0, -1)} not found.`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `HubSpot ${objectType} fetch failed: HTTP ${response.status} ${await response.text()}`,
      );
    }
    return (await response.json()) as HubSpotObject;
  }

  async getContactForPerson(
    personId: string,
    tenantId: string,
  ): Promise<HubSpotObject> {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, tenantId },
      select: { hubspotContactId: true },
    });
    if (!person) throw new NotFoundException('Person not found.');
    if (!person.hubspotContactId) {
      throw new BadRequestException(
        'Este contato não está vinculado ao HubSpot.',
      );
    }
    return this.fetchObject(
      tenantId,
      'contacts',
      person.hubspotContactId,
      CONTACT_PROPERTIES,
    );
  }

  async getCompanyForAccount(
    accountId: string,
    tenantId: string,
  ): Promise<HubSpotObject> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, tenantId },
      select: { hubspotCompanyId: true },
    });
    if (!account) throw new NotFoundException('Account not found.');
    if (!account.hubspotCompanyId) {
      throw new BadRequestException(
        'Esta empresa não está vinculada ao HubSpot.',
      );
    }
    return this.fetchObject(
      tenantId,
      'companies',
      account.hubspotCompanyId,
      COMPANY_PROPERTIES,
    );
  }
}
