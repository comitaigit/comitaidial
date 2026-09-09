import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { OverviewService, type OverviewWindowDays } from './overview.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

function parseWindowDays(raw: string | undefined): OverviewWindowDays {
  const value = Number(raw ?? 7);
  if (value === 7 || value === 15 || value === 30) return value;
  throw new BadRequestException('days must be one of 7, 15, 30.');
}

@Controller('overview')
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get('kpis')
  getKpis(
    @Query('days') days: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.overview.getKpis(user.tenantId, parseWindowDays(days));
  }

  // Separate from /kpis since it calls an LLM and can take a few seconds —
  // the KPIs shouldn't block on it.
  @Get('content-pill')
  getContentPill(
    @Query('days') days: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.overview.getContentPill(user.tenantId, parseWindowDays(days));
  }

  @Get('tasks')
  getTaskList(@CurrentUser() user: AuthenticatedUser) {
    return this.overview.getTaskList(user.tenantId);
  }

  // Meu Funil — same window param, but scoped to the requesting user.
  @Get('funnel')
  getFunnel(
    @Query('days') days: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.overview.getFunnel(
      user.tenantId,
      user.userId,
      parseWindowDays(days),
    );
  }
}
