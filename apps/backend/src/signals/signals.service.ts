import { Injectable } from '@nestjs/common';
import { SignalCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SignalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(
    tenantId: string,
    filters: {
      accountId?: string;
      personId?: string;
      category?: SignalCategory;
    },
  ) {
    return this.prisma.signal.findMany({
      where: {
        tenantId,
        accountId: filters.accountId,
        personId: filters.personId,
        category: filters.category,
      },
      orderBy: { occurredAt: 'desc' },
      include: {
        account: { select: { id: true, name: true } },
        person: { select: { id: true, name: true } },
      },
    });
  }
}
