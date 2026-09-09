import { Controller, Get, Param, Post } from '@nestjs/common';
import { PlayEngineService } from './play-engine.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

// The approval queue for AI-authored Actions a cadence's approvalMode
// (MANUAL, the default) held back — see PlayEngineService.createAction.
@Controller('actions')
export class PlayEngineController {
  constructor(private readonly playEngine: PlayEngineService) {}

  @Get('pending-approval')
  listPendingApproval(@CurrentUser() user: AuthenticatedUser) {
    return this.playEngine.listPendingApproval(user.userId, user.tenantId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.playEngine.approveAction(id, user.userId, user.tenantId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.playEngine.rejectAction(id, user.userId, user.tenantId);
  }
}
