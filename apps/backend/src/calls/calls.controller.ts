import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { validateRequest } from 'twilio';
import { CallsService } from './calls.service';
import { CreateTestCallDto } from './dto/create-test-call.dto';
import { UpdateCallOutcomeDto } from './dto/update-call-outcome.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  findAll(
    @Query('personId') personId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calls.findAll(user.tenantId, personId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.calls.findOne(id, user.tenantId);
  }

  @Post('test')
  test(@Body() dto: CreateTestCallDto, @CurrentUser() user: AuthenticatedUser) {
    return this.calls.placeTestCall(dto.to, user.userId, user.tenantId);
  }

  // Mints a short-lived Voice Access Token for the browser softphone
  // (@twilio/voice-sdk's Device) — identity = our own userId.
  @Post('voice-token')
  voiceToken(@CurrentUser() user: AuthenticatedUser) {
    return { token: this.calls.createVoiceAccessToken(user.userId) };
  }

  // The TwiML App's Voice URL — Twilio calls this directly (no user JWT),
  // so it's @Public() and instead verified via Twilio's own request
  // signature to stop anyone who finds this URL from placing arbitrary
  // outbound calls on our account (toll fraud).
  @Public()
  @Post('voice')
  async voice(
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const signature = req.header('X-Twilio-Signature') ?? '';
    const url = `${this.config.getOrThrow<string>('PUBLIC_API_URL')}/v1/calls/voice`;
    const isValid = validateRequest(
      this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
      signature,
      url,
      body,
    );
    if (!isValid) {
      throw new ForbiddenException('Invalid Twilio request signature.');
    }

    const twiml = await this.calls.handleVoiceWebhook(body);
    res.type('text/xml');
    return twiml;
  }

  @Patch(':id')
  updateOutcome(
    @Param('id') id: string,
    @Body() dto: UpdateCallOutcomeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calls.updateOutcome(id, dto, user.userId, user.tenantId);
  }
}
