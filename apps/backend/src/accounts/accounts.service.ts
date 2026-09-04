import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Account, AccountPriority, ActivityType } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

// CSV "Prioridade" column values, per the Dial spec — Portuguese labels
// only, accent/case-insensitive.
const PRIORITY_LABELS: Record<string, AccountPriority> = {
  alta: AccountPriority.HIGH,
  media: AccountPriority.MEDIUM,
  média: AccountPriority.MEDIUM,
  baixa: AccountPriority.LOW,
};

function parsePriority(raw: string | undefined): AccountPriority | undefined {
  if (!raw) return undefined;
  return PRIORITY_LABELS[raw.trim().toLowerCase()];
}

export type ImportAccountsResult = {
  created: number;
  merged: number;
  skipped: number;
  errors: string[];
};

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

  // "Nome da conta", "Segmento", "Prioridade" columns, per the Dial spec.
  // An existing Account with the same name (case-insensitive, within this
  // tenant) is merged — empty fields get filled in, populated ones are
  // never overwritten. Each row is its own transaction so one bad row
  // doesn't roll back an otherwise-good import; row-level failures are
  // collected and returned, not thrown.
  async importFromCsv(
    csv: string,
    userId: string,
    tenantId: string,
  ): Promise<ImportAccountsResult> {
    let records: Record<string, string>[];
    try {
      records = parse(csv, {
        columns: (header: string[]) => header.map((h) => h.trim()),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      throw new BadRequestException(
        `CSV inválido: ${err instanceof Error ? err.message : 'erro de parsing.'}`,
      );
    }

    let created = 0;
    let merged = 0;
    const errors: string[] = [];

    for (const [index, record] of records.entries()) {
      const rowNumber = index + 2; // header is row 1, data starts at row 2
      const name = record['Nome da conta']?.trim();
      if (!name) {
        errors.push(`Linha ${rowNumber}: "Nome da conta" é obrigatório.`);
        continue;
      }
      const segment = record['Segmento']?.trim() || undefined;
      const priority = parsePriority(record['Prioridade']);

      try {
        const outcome = await this.prisma.$transaction(async (tx) => {
          const existing = await tx.account.findFirst({
            where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          });

          if (existing) {
            const data: { segment?: string; priority?: AccountPriority } = {};
            if (!existing.segment && segment) data.segment = segment;
            if (!existing.priority && priority) data.priority = priority;
            if (Object.keys(data).length === 0) return 'unchanged' as const;

            const account = await tx.account.update({
              where: { id: existing.id },
              data,
            });
            await tx.activity.create({
              data: {
                type: ActivityType.FIELD_EDITED,
                tenantId,
                accountId: account.id,
                userId,
                payload: { fields: Object.keys(data), source: 'csv_import' },
              },
            });
            return 'merged' as const;
          }

          const account = await tx.account.create({
            data: { tenantId, name, segment, priority },
          });
          await tx.activity.create({
            data: {
              type: ActivityType.ACCOUNT_CREATED,
              tenantId,
              accountId: account.id,
              userId,
              payload: { name: account.name, source: 'csv_import' },
            },
          });
          return 'created' as const;
        });

        if (outcome === 'created') created++;
        else if (outcome === 'merged') merged++;
      } catch (err) {
        errors.push(
          `Linha ${rowNumber}: ${err instanceof Error ? err.message : 'erro ao salvar.'}`,
        );
      }
    }

    return { created, merged, skipped: errors.length, errors };
  }
}
