import { Body, Controller, Post } from '@nestjs/common';
import { LinkedInService } from './linkedin.service';
import { ObserveProfileDto } from './dto/observe-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

// Called by the BDR's browser extension (a separate deliverable, not part
// of this backend) — authenticated the same way as any other request,
// with the BDR's normal access token, no separate extension credential.
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
}
