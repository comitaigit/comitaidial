import { Controller, Get, Query } from '@nestjs/common';
import { SignalCategory } from '@prisma/client';
import { SignalsService } from './signals.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('signals')
export class SignalsController {
  constructor(private readonly signals: SignalsService) {}

  @Get()
  findAll(
    @Query('accountId') accountId: string | undefined,
    @Query('personId') personId: string | undefined,
    @Query('category') category: SignalCategory | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.signals.findAll(user.tenantId, {
      accountId,
      personId,
      category,
    });
  }
}
