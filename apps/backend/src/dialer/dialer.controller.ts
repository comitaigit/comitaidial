import { Controller, Get, Param, Query } from '@nestjs/common';
import { DialerService } from './dialer.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('dialer')
export class DialerController {
  constructor(private readonly dialer: DialerService) {}

  @Get('queue')
  getQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.dialer.getQueue(user.tenantId);
  }

  @Get('research/:accountId')
  getResearch(
    @Param('accountId') accountId: string,
    @Query('personRole') personRole: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dialer.getResearch(
      accountId,
      personRole ?? null,
      user.tenantId,
    );
  }
}
