import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CadencesService } from './cadences.service';
import { CreateCadenceDto } from './dto/create-cadence.dto';
import { CreateCadenceStepDto } from './dto/create-cadence-step.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('cadences')
export class CadencesController {
  constructor(private readonly cadences: CadencesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.cadences.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.cadences.findOne(id, user.tenantId);
  }

  @Post()
  create(
    @Body() dto: CreateCadenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cadences.create(dto, user.tenantId);
  }

  @Post(':id/steps')
  addStep(
    @Param('id') id: string,
    @Body() dto: CreateCadenceStepDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cadences.addStep(id, dto, user.tenantId);
  }

  @Post(':id/enrollments')
  enroll(
    @Param('id') id: string,
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cadences.enroll(id, dto, user.userId, user.tenantId);
  }
}
