import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AccessTokenPayload } from '../token.service';

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    // Whatever is returned here becomes `request.user`. Keep it minimal —
    // this runs on every authenticated request, so no DB round-trip here;
    // controllers that need fresh user state look it up explicitly.
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
