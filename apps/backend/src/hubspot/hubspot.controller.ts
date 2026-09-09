import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { HubSpotService } from './hubspot.service';
import { ConnectHubSpotDto } from './dto/connect-hubspot.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

// HubSpot is a tenant-wide connection (the client's shared CRM, not a
// per-BDR credential like Gmail) — connect/disconnect are ADMIN-only.
@Controller('hubspot')
export class HubSpotController {
  constructor(private readonly hubspot: HubSpotService) {}

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.hubspot.getStatus(user.tenantId);
  }

  @Roles('ADMIN')
  @Post('connect')
  async connect(
    @Body() dto: ConnectHubSpotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.hubspot.connect(user.tenantId, dto.accessToken);
    return { success: true };
  }

  @Roles('ADMIN')
  @Delete()
  async disconnect(@CurrentUser() user: AuthenticatedUser) {
    await this.hubspot.disconnect(user.tenantId);
    return { success: true };
  }

  @Get('people/:personId')
  getContactForPerson(
    @Param('personId') personId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.hubspot.getContactForPerson(personId, user.tenantId);
  }

  @Get('accounts/:accountId')
  getCompanyForAccount(
    @Param('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.hubspot.getCompanyForAccount(accountId, user.tenantId);
  }
}
