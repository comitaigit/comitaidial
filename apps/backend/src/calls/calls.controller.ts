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
import { StartParallelBatchDto } from './dto/start-parallel-batch.dto';
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

  // Discagem paralela — up to 3 lines at once (2026-08-25). The BDR picks a
  // cadence; this originates the outbound legs and returns enough for the
  // frontend to (a) join the conference via the softphone and (b) start
  // polling /parallel-batch/:id for status.
  @Post('parallel-batch')
  startParallelBatch(
    @Body() dto: StartParallelBatchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calls.startParallelBatch(
      dto.cadenceId,
      user.userId,
      user.tenantId,
    );
  }

  @Get('parallel-batch/:id')
  getParallelBatchStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calls.getBatchStatus(id, user.tenantId);
  }

  // BDR gave up before any line was answered — cancel whatever legs are
  // still ringing so a prospect who picks up a moment later isn't dropped
  // into an abandoned conference room.
  @Post('parallel-batch/:id/cancel')
  cancelParallelBatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.calls.cancelBatch(id, user.tenantId);
  }

  // The TwiML App's Voice URL — Twilio calls this directly (no user JWT),
  // so it's @Public() and instead verified via Twilio's own request
  // signature to stop anyone who finds this URL from placing arbitrary
  // outbound calls on our account (toll fraud). Handles both the
  // single-line flow (params.To) and, since 2026-08-25, the parallel-dial
  // flow (params.mode === 'parallel') — see CallsService.handleVoiceWebhook.
  @Public()
  @Post('voice')
  async voice(
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.verifyTwilioSignature(req, body);
    const twiml = await this.calls.handleVoiceWebhook(body);
    res.type('text/xml');
    return twiml;
  }

  // recordingStatusCallback from either the /voice TwiML's <Dial record="...">
  // (single-line) or the parallel-dial <Conference record="..."> (batchId
  // query param present). Same @Public() + signature verification as
  // /voice — Twilio calls this directly, no user JWT available.
  @Public()
  @Post('recording-status')
  async recordingStatus(
    @Body() body: Record<string, string>,
    @Query('batchId') batchId: string | undefined,
    @Req() req: Request,
  ) {
    this.verifyTwilioSignature(req, body);
    await this.calls.handleRecordingStatus(body, batchId);
  }

  // Initial TwiML for one outbound leg of a parallel batch — Twilio calls
  // this the instant the leg is answered (human or machine, AMD hasn't
  // reported yet). @Public(), signature-verified.
  @Public()
  @Post('parallel-leg')
  parallelLeg(
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.verifyTwilioSignature(req, body);
    res.type('text/xml');
    return this.calls.handleParallelLegInitial();
  }

  // Where handleParallelLegAmd redirects the winning leg once AMD confirms
  // a human — joins the same Conference room the BDR is waiting in.
  @Public()
  @Post('parallel-leg-join')
  async parallelLegJoin(
    @Query('callId') callId: string,
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.verifyTwilioSignature(req, body);
    res.type('text/xml');
    return this.calls.handleParallelLegJoin(callId);
  }

  // AsyncAmdStatusCallback — the actual race between the up-to-3 legs.
  @Public()
  @Post('parallel-leg-amd')
  async parallelLegAmd(
    @Query('callId') callId: string,
    @Body() body: Record<string, string>,
    @Req() req: Request,
  ) {
    this.verifyTwilioSignature(req, body);
    await this.calls.handleParallelLegAmd(callId, body);
  }

  // General statusCallback for a leg's terminal non-answered states
  // (busy/no-answer/failed) — connected/machine outcomes are already
  // handled by parallel-leg-amd.
  @Public()
  @Post('parallel-leg-status')
  async parallelLegStatus(
    @Query('callId') callId: string,
    @Body() body: Record<string, string>,
    @Req() req: Request,
  ) {
    this.verifyTwilioSignature(req, body);
    await this.calls.handleParallelLegStatus(callId, body);
  }

  // Twilio signs the request against the exact URL it hit, query string
  // included — req.originalUrl already carries the /v1 prefix (enabled via
  // URI versioning in main.ts) and whatever ?callId=/?batchId= we attached
  // when we built that webhook URL ourselves, so no path needs to be passed
  // in by each call site.
  private verifyTwilioSignature(
    req: Request,
    body: Record<string, string>,
  ): void {
    const signature = req.header('X-Twilio-Signature') ?? '';
    const url = `${this.config.getOrThrow<string>('PUBLIC_API_URL')}${req.originalUrl}`;
    const isValid = validateRequest(
      this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
      signature,
      url,
      body,
    );
    if (!isValid) {
      throw new ForbiddenException('Invalid Twilio request signature.');
    }
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
