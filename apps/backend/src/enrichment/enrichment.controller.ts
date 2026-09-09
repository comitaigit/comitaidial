import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { GrantCreditsDto } from './dto/grant-credits.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('enrichment')
export class EnrichmentController {
  constructor(private readonly enrichment: EnrichmentService) {}

  @Get('credits')
  async getCredits(@CurrentUser() user: AuthenticatedUser) {
    const balance = await this.enrichment.getCreditBalance(user.tenantId);
    return { balance };
  }

  // No billing/checkout exists yet — an ADMIN manually tops up credits
  // until one does. See schema.prisma's EnrichmentJob comment.
  @Roles('ADMIN')
  @Post('credits/grant')
  async grantCredits(
    @Body() dto: GrantCreditsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const balance = await this.enrichment.grantCredits(
      user.tenantId,
      dto.credits,
    );
    return { balance };
  }

  @Post('people/:id')
  enrichPerson(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.enrichment.enrichPerson(id, user.tenantId);
  }

  @Post('accounts/:id')
  enrichAccount(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.enrichment.enrichAccount(id, user.tenantId);
  }
}
