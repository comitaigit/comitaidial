import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3001;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL = '15m';

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_TTL = '30d';

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS!: string;

  @IsString()
  @IsOptional()
  REFRESH_COOKIE_NAME = 'comitai_rt';

  // Controls the refresh cookie's `Secure` flag. Defaults to following
  // NODE_ENV (see auth.controller.ts), which is correct once the app sits
  // behind HTTPS. Set explicitly to 'false' for a production deployment that
  // is temporarily served over plain HTTP (e.g. no domain/ACM cert yet) —
  // browsers silently drop `Secure` cookies on a non-HTTPS origin, which
  // otherwise breaks login without any visible error. Flip back to unset
  // (or 'true') as soon as HTTPS is in front of the app.
  @IsIn(['true', 'false'])
  @IsOptional()
  COOKIE_SECURE?: 'true' | 'false';

  // Set to a parent domain (e.g. ".comitai.app") when the frontend and API
  // are on sibling subdomains (comitai.app / api.comitai.app) — otherwise
  // the refresh cookie is host-only and never reaches the API's origin.
  // Leave unset for a single-origin deployment.
  @IsString()
  @IsOptional()
  COOKIE_DOMAIN?: string;

  @IsString()
  @IsNotEmpty()
  TWILIO_ACCOUNT_SID!: string;

  @IsString()
  @IsNotEmpty()
  TWILIO_AUTH_TOKEN!: string;

  // The caller ID used as `From` on outbound calls — either a Twilio-owned
  // number or a Verified Caller ID under the account. Must be in E.164
  // format (e.g. +5511958028794).
  @IsString()
  @IsNotEmpty()
  TWILIO_PHONE_NUMBER!: string;

  // API Key (not the main Auth Token) used to sign browser Voice Access
  // Tokens — Twilio's jwt.AccessToken requires an API Key SID/Secret pair,
  // not the account's main credentials. Create one in Console → Account →
  // API keys & tokens.
  @IsString()
  @IsNotEmpty()
  TWILIO_API_KEY_SID!: string;

  @IsString()
  @IsNotEmpty()
  TWILIO_API_KEY_SECRET!: string;

  // The TwiML App whose Voice URL points at this backend's
  // /v1/calls/voice webhook — see calls.controller.ts.
  @IsString()
  @IsNotEmpty()
  TWILIO_TWIML_APP_SID!: string;

  // This API's own public base URL (e.g. https://dev.api.comitai.app), used
  // to reconstruct the exact URL Twilio signed when validating the /calls/voice
  // webhook's X-Twilio-Signature — reconstructing it from request headers
  // instead would depend on trusting proxy headers, which is fragile behind
  // Nginx and would let a forged request bypass signature validation.
  @IsString()
  @IsNotEmpty()
  PUBLIC_API_URL!: string;

  // Used to generate the Overview page's AI insight pill — see
  // src/overview/overview.service.ts. Console → Settings → API Keys.
  @IsString()
  @IsNotEmpty()
  ANTHROPIC_API_KEY!: string;

  // Transcribes recorded calls for Call Check — console.deepgram.com →
  // API Keys. See src/transcription/transcription.service.ts.
  @IsString()
  @IsNotEmpty()
  DEEPGRAM_API_KEY!: string;
}

/**
 * Fails fast at boot if required env vars are missing/malformed, and rejects
 * access/refresh JWT secrets that are identical or too short — a weak or
 * shared signing secret is a common real-world JWT vulnerability.
 */
export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  if (validated.JWT_ACCESS_SECRET === validated.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be the same value.',
    );
  }

  if (
    validated.NODE_ENV === 'production' &&
    (validated.JWT_ACCESS_SECRET.length < 32 ||
      validated.JWT_REFRESH_SECRET.length < 32)
  ) {
    throw new Error(
      'JWT secrets must be at least 32 characters in production.',
    );
  }

  return validated;
}
