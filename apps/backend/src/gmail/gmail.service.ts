import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';

// Gmail-send only — no read/modify scope, since AI Email only ever sends,
// never inspects the BDR's inbox. userinfo.email identifies which address
// was actually authorized, for display in the connect UI.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

const STATE_TTL = '10m';

type OAuthState = {
  userId: string;
  tenantId: string;
  purpose: 'gmail-connect';
};

function encodeMimeSubject(subject: string): string {
  // RFC 2047 encoded-word — plain UTF-8 bytes in a header value are not
  // guaranteed to round-trip through every mail relay, and BDR subject
  // lines are in Portuguese (accents, ç).
  return `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
}

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  private redirectUri(): string {
    return `${this.config.getOrThrow<string>('PUBLIC_API_URL')}/v1/gmail/callback`;
  }

  private oauthClient() {
    return new google.auth.OAuth2(
      this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      this.redirectUri(),
    );
  }

  // Signed rather than opaque: the browser is redirected to Google and back
  // with this as a query param, so it must survive that round trip without
  // server-side session state — and be tamper-evident, since it's what ties
  // the callback back to the BDR who started the flow.
  getConnectUrl(userId: string, tenantId: string): string {
    const state = this.jwt.sign(
      { userId, tenantId, purpose: 'gmail-connect' } satisfies OAuthState,
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: STATE_TTL,
      },
    );
    return this.oauthClient().generateAuthUrl({
      access_type: 'offline',
      // Forces Google to return a refresh_token even if this BDR already
      // granted access before — without it, a reconnect after revoking
      // access elsewhere would silently come back with no refresh_token.
      prompt: 'consent',
      scope: SCOPES,
      state,
    });
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ userId: string; email: string }> {
    let parsed: OAuthState;
    try {
      parsed = this.jwt.verify<OAuthState>(state, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new BadRequestException(
        'Gmail connection link expired or invalid.',
      );
    }
    if (parsed.purpose !== 'gmail-connect') {
      throw new BadRequestException('Invalid state.');
    }

    const client = this.oauthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      throw new BadRequestException(
        'Google did not return a refresh token — disconnect any prior access at myaccount.google.com/permissions and try again.',
      );
    }

    client.setCredentials(tokens);
    const { data } = await google
      .oauth2({ version: 'v2', auth: client })
      .userinfo.get();
    if (!data.email) {
      throw new BadRequestException(
        'Could not read the connected Google account email.',
      );
    }

    await this.prisma.googleAccount.upsert({
      where: { userId: parsed.userId },
      create: {
        tenantId: parsed.tenantId,
        userId: parsed.userId,
        email: data.email,
        encryptedRefreshToken: this.encryption.encrypt(tokens.refresh_token),
        scope: tokens.scope ?? SCOPES.join(' '),
      },
      update: {
        email: data.email,
        encryptedRefreshToken: this.encryption.encrypt(tokens.refresh_token),
        scope: tokens.scope ?? SCOPES.join(' '),
      },
    });

    return { userId: parsed.userId, email: data.email };
  }

  async getStatus(
    userId: string,
  ): Promise<{ connected: boolean; email?: string }> {
    const account = await this.prisma.googleAccount.findUnique({
      where: { userId },
      select: { email: true },
    });
    return account
      ? { connected: true, email: account.email }
      : { connected: false };
  }

  async disconnect(userId: string): Promise<void> {
    const account = await this.prisma.googleAccount.findUnique({
      where: { userId },
    });
    if (!account) return;

    try {
      const client = this.oauthClient();
      await client.revokeToken(
        this.encryption.decrypt(account.encryptedRefreshToken),
      );
    } catch (err) {
      // Best-effort — Google may have already invalidated it independently.
      // Still remove our copy either way so a stale credential never lingers.
      this.logger.warn(
        `Failed to revoke Google token for user ${userId} (removing local record anyway): ${err instanceof Error ? err.message : err}`,
      );
    }

    await this.prisma.googleAccount.delete({ where: { userId } });
  }

  // Called by the Play Engine's action dispatcher — see PlayEngineService.
  // Throws (never silently drops) on any failure; the caller marks the
  // Action FAILED and logs the message.
  async sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string,
  ): Promise<void> {
    const account = await this.prisma.googleAccount.findUnique({
      where: { userId },
    });
    if (!account) {
      throw new NotFoundException(
        `User ${userId} has no connected Gmail account.`,
      );
    }

    const client = this.oauthClient();
    client.setCredentials({
      refresh_token: this.encryption.decrypt(account.encryptedRefreshToken),
    });

    const message = [
      `To: ${to}`,
      `Subject: ${encodeMimeSubject(subject)}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
    ].join('\r\n');

    const gmail = google.gmail({ version: 'v1', auth: client });
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: Buffer.from(message, 'utf-8').toString('base64url') },
    });
  }
}
