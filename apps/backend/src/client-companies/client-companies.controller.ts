import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientCompaniesService } from './client-companies.service';
import { CreateClientCompanyDto } from './dto/create-client-company.dto';
import { UpdateClientCompanyDto } from './dto/update-client-company.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('client-companies')
export class ClientCompaniesController {
  constructor(private readonly clientCompanies: ClientCompaniesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.clientCompanies.findAll(user.tenantId);
  }

  @Post()
  create(
    @Body() dto: CreateClientCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clientCompanies.create(dto, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clientCompanies.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.clientCompanies.remove(id, user.tenantId);
  }
}
