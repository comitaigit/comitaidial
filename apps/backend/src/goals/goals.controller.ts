import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CallOutcome, GoalPeriod } from '@prisma/client';
import { GoalsService } from './goals.service';
import { UpsertGoalDto } from './dto/upsert-goal.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get('me')
  getMyGoal(
    @Query('period') period: GoalPeriod | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.goals.getMyGoal(
      user.tenantId,
      user.userId,
      period ?? GoalPeriod.WEEKLY,
    );
  }

  @Put('me')
  upsertMyGoal(
    @Body() dto: UpsertGoalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.goals.upsertOwnGoal(user.tenantId, user.userId, user.role, dto);
  }

  // Manager override — sets any user's goal, always wins per the Dial
  // spec's "gestor tem prioridade em caso de conflito".
  @Roles('ADMIN')
  @Put(':userId')
  upsertGoalForUser(
    @Param('userId') targetUserId: string,
    @Body() dto: UpsertGoalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.goals.upsertGoalForUser(user.tenantId, targetUserId, dto);
  }

  // KPI Targets report. No role restriction — the whole team sees the
  // whole team's numbers, per the Dial spec.
  @Get('report')
  getReport(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('userId') userId: string | undefined,
    @Query('accountId') accountId: string | undefined,
    @Query('outcome') outcome: CallOutcome | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.goals.getReport(user.tenantId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userId,
      accountId,
      outcome,
    });
  }
}
