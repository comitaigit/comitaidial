import { Controller, Delete, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GmailService } from './gmail.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('gmail')
export class GmailController {
  constructor(
    private readonly gmail: GmailService,
    private readonly config: ConfigService,
  ) {}

  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.gmail.getStatus(user.userId);
  }

  @Get('connect')
  connect(@CurrentUser() user: AuthenticatedUser) {
    return { url: this.gmail.getConnectUrl(user.userId, user.tenantId) };
  }

  // Hit directly by the browser on Google's redirect — no Authorization
  // header available, so identity comes from the signed `state` param
  // instead (see GmailService.getConnectUrl/handleCallback).
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    if (error || !code || !state) {
      res.redirect(`${frontendUrl}/workspace/settings?gmail=error`);
      return;
    }

    try {
      await this.gmail.handleCallback(code, state);
      res.redirect(`${frontendUrl}/workspace/settings?gmail=connected`);
    } catch {
      res.redirect(`${frontendUrl}/workspace/settings?gmail=error`);
    }
  }

  @Delete()
  async disconnect(@CurrentUser() user: AuthenticatedUser) {
    await this.gmail.disconnect(user.userId);
    return { success: true };
  }
}
