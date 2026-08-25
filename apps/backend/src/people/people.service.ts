import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, InfluenceLevel, Person } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

// CSV "Nível de influência" column values, per the Dial spec — Portuguese
// labels only, accent/case-insensitive.
const INFLUENCE_LABELS: Record<string, InfluenceLevel> = {
  'decisor financeiro': InfluenceLevel.FINANCIAL_DECISION_MAKER,
  'influenciador direto': InfluenceLevel.DIRECT_INFLUENCER,
  'decisor operacional': InfluenceLevel.OPERATIONAL_DECISION_MAKER,
  'influenciador indireto': InfluenceLevel.INDIRECT_INFLUENCER,
};

function parseInfluenceLevel(
  raw: string | undefined,
): InfluenceLevel | undefined {
  if (!raw) return undefined;
  return INFLUENCE_LABELS[raw.trim().toLowerCase()];
}

export type ImportPeopleResult = {
  created: number;
  merged: number;
  skipped: number;
  enrolledInCadence: number;
  errors: string[];
};

const CADENCE_INCLUDE = {
  cadenceEnrollments: {
    where: { active: true },
    select: { cadence: { select: { id: true, name: true } } },
  },
} as const;

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, accountId?: string) {
    return this.prisma.person.findMany({
      where: accountId ? { tenantId, accountId } : { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, name: true } },
        ...CADENCE_INCLUDE,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, tenantId },
      include: {
        account: { select: { id: true, name: true } },
        ...CADENCE_INCLUDE,
      },
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

  // "Prospect (Nome)", "Nome da conta", "Celular", "LinkedIn (URL do
  // perfil)", "Nível de influência" columns, per the Dial spec. A row whose
  // account name doesn't match an existing Account creates one (segment/
  // priority left blank, pending manual fill). A row whose phone matches an
  // existing Person in this tenant merges into it (empty fields only, never
  // overwriting). Optionally enrolls every created/matched person into
  // cadenceId. Each row is its own transaction, same reasoning as
  // AccountsService.importFromCsv — one bad row shouldn't roll back the rest.
  async importFromCsv(
    csv: string,
    cadenceId: string | undefined,
    userId: string,
    tenantId: string,
  ): Promise<ImportPeopleResult> {
    if (cadenceId) {
      const cadence = await this.prisma.cadence.findFirst({
        where: { id: cadenceId, tenantId },
      });
      if (!cadence) throw new NotFoundException('Cadence not found.');
      if (!cadence.active)
        throw new BadRequestException('Cadence is not active.');
    }

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
    let enrolledInCadence = 0;
    const errors: string[] = [];

    for (const [index, record] of records.entries()) {
      const rowNumber = index + 2; // header is row 1, data starts at row 2
      const name = record['Prospect (Nome)']?.trim();
      const accountName = record['Nome da conta']?.trim();
      if (!name || !accountName) {
        errors.push(
          `Linha ${rowNumber}: "Prospect (Nome)" e "Nome da conta" são obrigatórios.`,
        );
        continue;
      }
      const phone = record['Celular']?.trim() || undefined;
      const linkedinUrl =
        record['LinkedIn (URL do perfil)']?.trim() || undefined;
      const jobTitle = record['Job Title']?.trim() || undefined;
      const influenceLevel = parseInfluenceLevel(record['Nível de influência']);

      try {
        const outcome = await this.prisma.$transaction(async (tx) => {
          let account = await tx.account.findFirst({
            where: {
              tenantId,
              name: { equals: accountName, mode: 'insensitive' },
            },
          });
          if (!account) {
            account = await tx.account.create({
              data: { tenantId, name: accountName },
            });
          }

          const existing = phone
            ? await tx.person.findFirst({
                where: {
                  tenantId,
                  phone: { equals: phone, mode: 'insensitive' },
                },
              })
            : null;

          let personId: string;
          let result: 'created' | 'merged';

          if (existing) {
            const data: {
              linkedinUrl?: string;
              influenceLevel?: InfluenceLevel;
              role?: string;
            } = {};
            if (!existing.linkedinUrl && linkedinUrl)
              data.linkedinUrl = linkedinUrl;
            if (!existing.influenceLevel && influenceLevel)
              data.influenceLevel = influenceLevel;
            if (!existing.role && jobTitle) data.role = jobTitle;

            if (Object.keys(data).length > 0) {
              const person = await tx.person.update({
                where: { id: existing.id },
                data,
              });
              await tx.activity.create({
                data: {
                  type: ActivityType.FIELD_EDITED,
                  tenantId,
                  accountId: person.accountId,
                  personId: person.id,
                  userId,
                  payload: { fields: Object.keys(data), source: 'csv_import' },
                },
              });
            }
            personId = existing.id;
            result = 'merged';
          } else {
            const person = await tx.person.create({
              data: {
                tenantId,
                accountId: account.id,
                name,
                phone,
                linkedinUrl,
                influenceLevel,
                role: jobTitle,
              },
            });
            await tx.activity.create({
              data: {
                type: ActivityType.PERSON_CREATED,
                tenantId,
                accountId: person.accountId,
                personId: person.id,
                userId,
                payload: { name: person.name, source: 'csv_import' },
              },
            });
            personId = person.id;
            result = 'created';
          }

          if (cadenceId) {
            await tx.cadenceEnrollment.upsert({
              where: { cadenceId_personId: { cadenceId, personId } },
              create: { tenantId, cadenceId, personId },
              update: {},
            });
          }

          return result;
        });

        if (outcome === 'created') created++;
        else merged++;
        if (cadenceId) enrolledInCadence++;
      } catch (err) {
        errors.push(
          `Linha ${rowNumber}: ${err instanceof Error ? err.message : 'erro ao salvar.'}`,
        );
      }
    }

    return {
      created,
      merged,
      skipped: errors.length,
      enrolledInCadence,
      errors,
    };
  }
}
