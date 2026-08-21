import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CallsModule } from './calls/calls.module';
import { AccountsModule } from './accounts/accounts.module';
import { PeopleModule } from './people/people.module';
import { CadencesModule } from './cadences/cadences.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        // Global default; auth endpoints override with tighter limits via @Throttle().
        { name: 'default', ttl: 60_000, limit: 60 },
      ],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CallsModule,
    AccountsModule,
    PeopleModule,
    CadencesModule,
  ],
  controllers: [AppController],
  providers: [
    // Order matters: rate limiting first, then "is this token valid", then
    // "is this role allowed" — cheapest/broadest checks run first.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
