import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { DialerService } from './dialer.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('dialer')
export class DialerController {
  constructor(private readonly dialer: DialerService) {}

  @Get('queue')
  getQueue(
    @Query('cadenceId') cadenceId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!cadenceId) {
      throw new BadRequestException('cadenceId is required.');
    }
    return this.dialer.getQueue(user.tenantId, cadenceId);
  }

  @Get('research/:accountId')
  getResearch(
    @Param('accountId') accountId: string,
    @Query('personRole') personRole: string | undefined,
    @Query('clientCompanyId') clientCompanyId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!clientCompanyId) {
      throw new BadRequestException('clientCompanyId is required.');
    }
    return this.dialer.getResearch(
      accountId,
      personRole ?? null,
      clientCompanyId,
      user.tenantId,
    );
  }
}
