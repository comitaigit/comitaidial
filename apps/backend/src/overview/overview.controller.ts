import { Controller, Get } from '@nestjs/common';
import { OverviewService } from './overview.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.overview.getSummary(user.tenantId);
  }

  // Separate from /summary since it calls an LLM and can take a few
  // seconds — the KPIs/work queue shouldn't block on it.
  @Get('insight')
  getInsight(@CurrentUser() user: AuthenticatedUser) {
    return this.overview.getInsight(user.tenantId);
  }
}
