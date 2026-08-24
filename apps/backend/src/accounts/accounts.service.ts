import { Injectable, NotFoundException } from '@nestjs/common';
import { Account, ActivityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.account.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { people: true } } },
    });
  }

  async findOne(id: string, tenantId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { people: true } } },
    });
    if (!account) throw new NotFoundException('Account not found.');
    return account;
  }

  // Writes the Account row and its Activity audit record in one transaction
  // so the action is durably recorded before the caller ever sees a response —
  // no domain state may exist only as a UI-visible change.
  create(
    dto: CreateAccountDto,
    userId: string,
    tenantId: string,
  ): Promise<Account> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({ data: { ...dto, tenantId } });
      await tx.activity.create({
        data: {
          type: ActivityType.ACCOUNT_CREATED,
          tenantId,
          accountId: account.id,
          userId,
          payload: { name: account.name },
        },
      });
      return account;
    });
  }

  async update(
    id: string,
    dto: UpdateAccountDto,
    userId: string,
    tenantId: string,
  ): Promise<Account> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.account.findFirst({ where: { id, tenantId } });
      if (!existing) throw new NotFoundException('Account not found.');

      const account = await tx.account.update({ where: { id }, data: dto });
      await tx.activity.create({
        data: {
          type: ActivityType.FIELD_EDITED,
          tenantId,
          accountId: account.id,
          userId,
          payload: { fields: Object.keys(dto) },
        },
      });
      return account;
    });
  }
}
