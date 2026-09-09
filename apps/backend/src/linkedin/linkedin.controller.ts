import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { LinkedInService } from './linkedin.service';
import { ObserveProfileDto } from './dto/observe-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

// Called by the BDR's browser extension (apps/extension) — authenticated
// the same way as any other request, with the BDR's normal access token,
// no separate extension credential.
@Controller('linkedin')
export class LinkedInController {
  constructor(private readonly linkedin: LinkedInService) {}

  @Post('observe')
  observeProfile(
    @Body() dto: ObserveProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.linkedin.observeProfile(user.tenantId, dto);
  }

  // Pending LINKEDIN_CONNECT/LINKEDIN_MESSAGE Actions the extension shows
  // in its popup for the current BDR to act on — rate-limited server-side,
  // see LinkedInService.getPendingActions.
  @Get('actions/pending')
  getPendingActions(@CurrentUser() user: AuthenticatedUser) {
    return this.linkedin.getPendingActions(user.userId, user.tenantId);
  }

  // The BDR confirms they clicked LinkedIn's own Connect/Message button
  // themselves — this never triggers the action on LinkedIn's UI itself.
  @Post('actions/:id/complete')
  completeAction(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.linkedin.completeAction(id, user.userId, user.tenantId);
  }

  @Post('actions/:id/skip')
  skipAction(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.linkedin.skipAction(id, user.userId, user.tenantId);
  }
}
