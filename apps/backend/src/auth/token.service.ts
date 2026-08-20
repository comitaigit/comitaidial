import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

const REFRESH_TOKEN_BYTES = 64;

/**
 * Handles everything token-shaped: signing/verifying short-lived JWT access
 * tokens, and issuing/rotating/revoking opaque refresh tokens.
 *
 * Refresh tokens are NOT JWTs. They're random bytes handed to the client
 * and only ever stored server-side as a SHA-256 hash — this means a leaked
 * database dump doesn't hand an attacker usable refresh tokens (mirrors how
 * passwords are stored), and revocation is a simple DB row update rather
 * than needing a JWT blocklist.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      // Cast: @nestjs/jwt types expiresIn as the `ms`-package StringValue
      // union, but this is validated as a well-formed duration string at
      // boot by env.validation.ts's schema, so it's always one of those.
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') as never,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwt.verify<AccessTokenPayload>(token, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  private hashRefreshToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private refreshTtlMs(): number {
    const ttl = this.config.get<string>('JWT_REFRESH_TTL', '30d');
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
      match[2] as 's' | 'm' | 'h' | 'd'
    ];
    return value * unitMs;
  }

  /** Issues a brand-new refresh token (used at login), not part of a chain. */
  async issueRefreshToken(
    userId: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<string> {
    const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashRefreshToken(rawToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
      },
    });
    return rawToken;
  }

  /**
   * Validates a presented raw refresh token and rotates it: the old token
   * is marked revoked + linked to its replacement, and a new raw token is
   * returned. Detects reuse of an already-revoked token (a strong signal
   * the token was stolen) and, if seen, revokes the entire chain for that
   * user as a precaution.
   */
  async rotateRefreshToken(
    rawToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<
    | { status: 'ok'; userId: string; newRawToken: string }
    | { status: 'reused'; userId: string }
    | { status: 'invalid' }
  > {
    const tokenHash = this.hashRefreshToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) return { status: 'invalid' };

    if (stored.revokedAt) {
      // Reuse of a rotated-out token — likely theft. Nuke the user's whole
      // refresh-token chain so a stolen token can't keep being replayed.
      await this.revokeAllForUser(stored.userId);
      return { status: 'reused', userId: stored.userId };
    }

    if (stored.expiresAt < new Date()) {
      return { status: 'invalid' };
    }

    const newRawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const newTokenHash = this.hashRefreshToken(newRawToken);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedByTokenHash: newTokenHash },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newTokenHash,
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress,
          expiresAt: new Date(Date.now() + this.refreshTtlMs()),
        },
      }),
    ]);

    return { status: 'ok', userId: stored.userId, newRawToken };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
