import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, CadenceEnrollment, CadenceStep } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCadenceDto } from './dto/create-cadence.dto';
import { UpdateCadenceDto } from './dto/update-cadence.dto';
import { CreateCadenceStepDto } from './dto/create-cadence-step.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class CadencesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.cadence.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        clientCompany: true,
        _count: { select: { steps: true, enrollments: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const cadence = await this.prisma.cadence.findFirst({
      where: { id, tenantId },
      include: {
        clientCompany: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });
    if (!cadence) throw new NotFoundException('Cadence not found.');
    return cadence;
  }

  // Template setup, not a per-contact action — doesn't need an Activity
  // audit record (see cadences/steps' schema.prisma comment: the audit
  // rule covers actions taken on a Person/Account, not sequence authoring).
  create(dto: CreateCadenceDto, tenantId: string) {
    return this.prisma.cadence.create({
      data: { ...dto, tenantId },
      include: { clientCompany: true },
    });
  }

  async update(id: string, dto: UpdateCadenceDto, tenantId: string) {
    const existing = await this.prisma.cadence.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Cadence not found.');

    return this.prisma.cadence.update({
      where: { id },
      data: dto,
      include: { clientCompany: true },
    });
  }

  async addStep(
    cadenceId: string,
    dto: CreateCadenceStepDto,
    tenantId: string,
  ): Promise<CadenceStep> {
    const cadence = await this.prisma.cadence.findFirst({
      where: { id: cadenceId, tenantId },
    });
    if (!cadence) throw new NotFoundException('Cadence not found.');

    const order = await this.prisma.cadenceStep.count({ where: { cadenceId } });
    return this.prisma.cadenceStep.create({
      data: { ...dto, cadenceId, tenantId, order },
    });
  }

  // Enrolling a Person is a per-contact action ("mover em cadência") — the
  // Activity record is written in the same transaction as the enrollment,
  // same pattern as AccountsService/PeopleService.
  async enroll(
    cadenceId: string,
    dto: CreateEnrollmentDto,
    userId: string,
    tenantId: string,
  ): Promise<CadenceEnrollment> {
    return this.prisma.$transaction(async (tx) => {
      const cadence = await tx.cadence.findFirst({
        where: { id: cadenceId, tenantId },
      });
      if (!cadence) throw new NotFoundException('Cadence not found.');
      if (!cadence.active)
        throw new BadRequestException('Cadence is not active.');

      const person = await tx.person.findFirst({
        where: { id: dto.personId, tenantId },
      });
      if (!person) throw new NotFoundException('Person not found.');

      const enrollment = await tx.cadenceEnrollment.create({
        data: { cadenceId, personId: dto.personId, tenantId },
      });
      await tx.activity.create({
        data: {
          type: ActivityType.CADENCE_STEP_ADVANCED,
          tenantId,
          accountId: person.accountId,
          personId: person.id,
          userId,
          payload: { cadenceId, cadenceName: cadence.name, stepOrder: 0 },
        },
      });
      return enrollment;
    });
  }
}
