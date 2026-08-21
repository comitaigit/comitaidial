import { Controller, Get, Query } from '@nestjs/common';
import { SignalCategory } from '@prisma/client';
import { SignalsService } from './signals.service';

@Controller('signals')
export class SignalsController {
  constructor(private readonly signals: SignalsService) {}

  @Get()
  findAll(
    @Query('accountId') accountId?: string,
    @Query('personId') personId?: string,
    @Query('category') category?: SignalCategory,
  ) {
    return this.signals.findAll({ accountId, personId, category });
  }
}
