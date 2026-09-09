import { Body, Controller, Post } from '@nestjs/common';
import { ProspectingService } from './prospecting.service';
import { FindContactDto } from './dto/find-contact.dto';
import { DiscoverAccountsDto } from './dto/discover-accounts.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('prospecting')
export class ProspectingController {
  constructor(private readonly prospecting: ProspectingService) {}

  @Post('find-contact')
  findContact(
    @Body() dto: FindContactDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prospecting.findContact(
      dto.accountId,
      dto.clientCompanyId,
      user.tenantId,
      user.userId,
    );
  }

  @Post('discover-accounts')
  discoverAccounts(
    @Body() dto: DiscoverAccountsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prospecting.discoverAccounts(
      dto.seedAccountIds,
      user.tenantId,
      user.userId,
      dto.limit ?? 5,
    );
  }
}
