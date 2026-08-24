import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Person } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, accountId?: string) {
    return this.prisma.person.findMany({
      where: accountId ? { tenantId, accountId } : { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { account: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string, tenantId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, tenantId },
      include: { account: { select: { id: true, name: true } } },
    });
    if (!person) throw new NotFoundException('Person not found.');
    return person;
  }

  // Same pattern as AccountsService: the Person row and its Activity audit
  // record are written in one transaction, so the action is durable before
  // the response — and any UI change — happens.
  create(
    dto: CreatePersonDto,
    userId: string,
    tenantId: string,
  ): Promise<Person> {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: dto.accountId, tenantId },
      });
      if (!account) throw new NotFoundException('Account not found.');

      const person = await tx.person.create({ data: { ...dto, tenantId } });
      await tx.activity.create({
        data: {
          type: ActivityType.PERSON_CREATED,
          tenantId,
          accountId: person.accountId,
          personId: person.id,
          userId,
          payload: { name: person.name },
        },
      });
      return person;
    });
  }

  async update(
    id: string,
    dto: UpdatePersonDto,
    userId: string,
    tenantId: string,
  ): Promise<Person> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.person.findFirst({ where: { id, tenantId } });
      if (!existing) throw new NotFoundException('Person not found.');

      const person = await tx.person.update({ where: { id }, data: dto });
      await tx.activity.create({
        data: {
          type: ActivityType.FIELD_EDITED,
          tenantId,
          accountId: person.accountId,
          personId: person.id,
          userId,
          payload: { fields: Object.keys(dto) },
        },
      });
      return person;
    });
  }
}
