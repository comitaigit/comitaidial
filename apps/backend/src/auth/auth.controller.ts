import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

// Must match @Controller('auth') combined with the global URI versioning
// prefix set in main.ts (enableVersioning + defaultVersion) — kept as one
// constant so the refresh cookie's `path` can never drift out of sync with
// the actual route prefix (a mismatch here means the cookie silently never
// gets sent, which is easy to miss since it just looks like "not logged in").
const AUTH_COOKIE_PATH = '/v1/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private cookieName(): string {
    return this.config.get<string>('REFRESH_COOKIE_NAME', 'comitai_rt');
  }

  // COOKIE_SECURE, when explicitly set, overrides the NODE_ENV-based default
  // — see env.validation.ts for why (plain-HTTP production deploys).
  private isCookieSecure(): boolean {
    const override = this.config.get<'true' | 'false' | undefined>(
      'COOKIE_SECURE',
    );
    if (override !== undefined) return override === 'true';
    return this.config.get('NODE_ENV') === 'production';
  }

  // COOKIE_DOMAIN, when set (e.g. ".comitai.app"), lets the refresh cookie
  // be sent across sibling subdomains — the frontend (comitai.app) and API
  // (api.comitai.app) are different origins, so without this the cookie set
  // by the API response would never reach it back on refresh/logout calls
  // made from the frontend's origin. Left unset, the cookie defaults to
  // host-only (current behavior for a single-origin deployment).
  private cookieDomain(): string | undefined {
    return this.config.get<string>('COOKIE_DOMAIN') || undefined;
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(this.cookieName(), token, {
      httpOnly: true,
      secure: this.isCookieSecure(),
      sameSite: 'strict',
      domain: this.cookieDomain(),
      path: AUTH_COOKIE_PATH, // only sent to auth endpoints (refresh/logout), not the whole API
      maxAge: this.refreshCookieMaxAgeMs(),
    });
  }

  private refreshCookieMaxAgeMs(): number {
    const ttl = this.config.get<string>('JWT_REFRESH_TTL', '30d');
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
      match[2] as 's' | 'm' | 'h' | 'd'
    ];
    return Number(match[1]) * unitMs;
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(this.cookieName(), {
      path: AUTH_COOKIE_PATH,
      domain: this.cookieDomain(),
    });
  }

  private requestMeta(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto, this.requestMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, this.requestMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[this.cookieName()];
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Missing session.');
    }

    const result = await this.auth.refresh(rawRefreshToken, this.requestMeta(req));
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.[this.cookieName()];
    if (rawRefreshToken) {
      await this.auth.logout(rawRefreshToken, user.userId, this.requestMeta(req));
    }
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAllSessions(user.userId);
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.users.findById(authUser.userId);
    if (!user) throw new UnauthorizedException('User no longer exists.');
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
