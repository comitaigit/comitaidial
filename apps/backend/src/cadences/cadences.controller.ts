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
  findAll() {
    return this.cadences.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cadences.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCadenceDto) {
    return this.cadences.create(dto);
  }

  @Post(':id/steps')
  addStep(@Param('id') id: string, @Body() dto: CreateCadenceStepDto) {
    return this.cadences.addStep(id, dto);
  }

  @Post(':id/enrollments')
  enroll(
    @Param('id') id: string,
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cadences.enroll(id, dto, user.userId);
  }
}
