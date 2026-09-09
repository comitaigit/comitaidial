import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Deliberately global, not tenant-scoped — see the SuppressedNumber model's
// comment in schema.prisma for why this is an intentional exception to the
// rest of the app's multi-tenant isolation.
@Injectable()
export class SuppressionService {
  constructor(private readonly prisma: PrismaService) {}

  async isSuppressed(phoneNumber: string): Promise<boolean> {
    const found = await this.prisma.suppressedNumber.findUnique({
      where: { phoneNumber },
      select: { id: true },
    });
    return found !== null;
  }

  async suppressedNumbers(phoneNumbers: string[]): Promise<Set<string>> {
    if (phoneNumbers.length === 0) return new Set();
    const rows = await this.prisma.suppressedNumber.findMany({
      where: { phoneNumber: { in: phoneNumbers } },
      select: { phoneNumber: true },
    });
    return new Set(rows.map((r) => r.phoneNumber));
  }

  async suppress(
    phoneNumber: string,
    tenantId: string,
    reason?: string,
  ): Promise<void> {
    await this.prisma.suppressedNumber.upsert({
      where: { phoneNumber },
      create: { phoneNumber, reason, suppressedByTenantId: tenantId },
      update: {},
    });
  }
}
