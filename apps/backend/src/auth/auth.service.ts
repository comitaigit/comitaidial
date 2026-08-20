import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export type RequestMeta = { userAgent?: string; ipAddress?: string };

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      // Same generic message a login failure would give — don't leak
      // whether an email is registered via a distinguishable error.
      throw new ConflictException('Unable to register with these details.');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    return this.issueSession(user.id, user.email, user.role, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);

    // Always hash something, even for an unknown email, so response timing
    // doesn't reveal whether the account exists (mitigates user enumeration
    // via timing side-channel).
    const passwordHash = user?.passwordHash ?? (await argon2.hash('placeholder'));

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      await this.logEvent('LOGIN_FAILURE', meta, {
        email: dto.email,
        userId: user.id,
        reason: 'account_locked',
      });
      throw new ForbiddenException(
        'Account temporarily locked due to repeated failed login attempts.',
      );
    }

    const passwordValid = await argon2.verify(passwordHash, dto.password).catch(() => false);

    if (!user || !passwordValid) {
      if (user) {
        const locked = await this.users.recordFailedLogin(
          user.id,
          MAX_FAILED_ATTEMPTS,
          LOCKOUT_MINUTES,
        );
        await this.logEvent(locked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILURE', meta, {
          email: dto.email,
          userId: user.id,
        });
      } else {
        await this.logEvent('LOGIN_FAILURE', meta, { email: dto.email });
      }
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.users.resetFailedLogins(user.id);
    await this.logEvent('LOGIN_SUCCESS', meta, { email: dto.email, userId: user.id });

    return this.issueSession(user.id, user.email, user.role, meta);
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthResult> {
    const result = await this.tokens.rotateRefreshToken(rawRefreshToken, meta);

    if (result.status === 'reused') {
      await this.logEvent('TOKEN_REUSE_DETECTED', meta, { userId: result.userId });
      throw new UnauthorizedException('Session invalidated. Please log in again.');
    }

    if (result.status === 'invalid') {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    const user = await this.users.findById(result.userId);
    if (!user) throw new UnauthorizedException('Invalid session.');

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken: result.newRawToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async logout(rawRefreshToken: string, userId: string, meta: RequestMeta): Promise<void> {
    await this.tokens.revokeRefreshToken(rawRefreshToken);
    await this.logEvent('LOGOUT', meta, { userId });
  }

  /** Revokes every session for a user — e.g. "log out everywhere" / suspected compromise. */
  logoutAllSessions(userId: string): Promise<void> {
    return this.tokens.revokeAllForUser(userId);
  }

  private async issueSession(
    userId: string,
    email: string,
    role: string,
    meta: RequestMeta,
  ): Promise<AuthResult> {
    const accessToken = this.tokens.signAccessToken({ sub: userId, email, role });
    const refreshToken = await this.tokens.issueRefreshToken(userId, meta);
    const user = await this.users.findById(userId);

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, name: user!.name, role },
    };
  }

  private async logEvent(
    type:
      | 'LOGIN_SUCCESS'
      | 'LOGIN_FAILURE'
      | 'LOGOUT'
      | 'TOKEN_REUSE_DETECTED'
      | 'ACCOUNT_LOCKED',
    meta: RequestMeta,
    extra: { email?: string; userId?: string; reason?: string },
  ): Promise<void> {
    await this.prisma.loginEvent.create({
      data: {
        type,
        email: extra.email,
        userId: extra.userId,
        reason: extra.reason,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  }
}
