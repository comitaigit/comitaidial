import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientCompany } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientCompanyDto } from './dto/create-client-company.dto';
import { UpdateClientCompanyDto } from './dto/update-client-company.dto';

@Injectable()
export class ClientCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<ClientCompany[]> {
    return this.prisma.clientCompany.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  create(
    dto: CreateClientCompanyDto,
    tenantId: string,
  ): Promise<ClientCompany> {
    return this.prisma.clientCompany.create({ data: { ...dto, tenantId } });
  }

  async update(
    id: string,
    dto: UpdateClientCompanyDto,
    tenantId: string,
  ): Promise<ClientCompany> {
    const existing = await this.prisma.clientCompany.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Client company not found.');

    return this.prisma.clientCompany.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const existing = await this.prisma.clientCompany.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Client company not found.');

    // Cadences pointing at this row fall back to null (SetNull FK) — they
    // go back to "incomplete" rather than being deleted or blocked here.
    await this.prisma.clientCompany.delete({ where: { id } });
  }
}
