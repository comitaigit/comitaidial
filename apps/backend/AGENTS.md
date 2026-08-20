# Comitai backend — project conventions

NestJS 11 API for Comitai Dialer: authentication (JWT access + rotating refresh tokens),
users, and whatever domain modules come next. Postgres via Prisma. Runs in Docker
(see ../../docker-compose.yml) for local dev; the monorepo root's pnpm workspace is
required to build (`context: .` in the compose file, not `apps/backend`).

## Architecture: feature modules, not technical layers

```
src/
  <feature>/
    <feature>.module.ts
    <feature>.controller.ts    (only if the feature exposes HTTP routes)
    <feature>.service.ts
    dto/                       request/response shapes, validated with class-validator
    guards/ strategies/ decorators/   (auth-specific; most features won't need these)
  common/
    filters/                   global exception filter
    (guards/interceptors/decorators used by 2+ features — nothing here yet beyond auth's)
  config/
    env.validation.ts          class-validator schema — the app refuses to boot on bad config
  prisma/
    prisma.service.ts          PrismaClient wrapper, connect/disconnect lifecycle hooks
    prisma.module.ts           @Global() — every module can inject PrismaService directly
```

Rules:
- A feature's controller stays thin: parse/validate via DTO, delegate to the service,
  shape the response. Business logic lives in the service, not the controller.
- Services never touch `req`/`res` directly — pass in only the plain data they need
  (see `AuthService.login(dto, meta)` taking a small `RequestMeta`, not `Request`).
- DTOs (`dto/*.dto.ts`) are the *only* thing a controller accepts as input and are never
  the same class as a Prisma model — a Prisma `User` includes `passwordHash`; nothing
  outside `UsersService`/`AuthService` should ever see that field.
- Don't reach for `@Global()` beyond `PrismaModule`. Every other cross-feature dependency
  is an explicit `imports: [...]` + `exports: [...]`.

## Security model — read before touching auth code

- **Passwords**: argon2id (`argon2.hash`/`argon2.verify`), never bcrypt/md5/plain.
  Minimum 12 chars, mixed case + digit, enforced in `RegisterDto`.
- **Access tokens**: short-lived JWT (`JWT_ACCESS_TTL`, default 15m), HS256, verified via
  `JwtStrategy` + the global `JwtAuthGuard`. Every route requires a valid one *unless*
  annotated `@Public()` — auth is opt-out, not opt-in.
- **Refresh tokens**: NOT JWTs. Random 64-byte tokens, stored server-side only as a
  SHA-256 hash (`TokenService`), delivered to the client exclusively via an `httpOnly`,
  `Secure` (prod), `SameSite=Strict` cookie scoped to `/v1/auth` (see `AUTH_COOKIE_PATH`
  in `auth.controller.ts` — **must stay in sync with the URI versioning prefix set in
  `main.ts`, or the cookie silently stops being sent**). Never put the refresh token in
  a JSON response body.
- **Rotation + reuse detection**: every `/auth/refresh` call revokes the presented token
  and issues a new one (`TokenService.rotateRefreshToken`). Presenting an already-revoked
  token is treated as likely theft and revokes the user's *entire* refresh-token chain
  (`TOKEN_REUSE_DETECTED` in `login_events`).
- **Brute force**: `@Throttle()` on `/auth/login` and `/auth/register` (5/min) as the
  first line of defense, plus a persisted per-account lockout
  (`UsersService.recordFailedLogin`, 5 attempts → 15 min lock) that survives across
  instances/restarts, unlike an in-memory counter.
- **Enumeration resistance**: login always returns the same generic
  "Invalid email or password." for both an unknown email and a wrong password, and
  always runs an argon2 hash (against a placeholder if the user doesn't exist) so
  response timing doesn't leak which case occurred.
- **Audit trail**: every login attempt (success/failure/lockout/reuse/logout) is written
  to `login_events` via `AuthService`'s private `logEvent` — don't bypass this when
  adding new auth flows.
- **Input validation**: global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`
  in `main.ts` — a request with fields not on the DTO is rejected outright, not silently
  stripped, and DTOs are the enforcement point, not ad-hoc checks in controllers.
- **Transport**: `helmet()` for security headers, CORS locked to `CORS_ORIGINS` with
  `credentials: true` (required for the refresh cookie) — never widen this to `*`.
- **Config**: `env.validation.ts` fails startup immediately on a missing/malformed env
  var, and specifically rejects `JWT_ACCESS_SECRET === JWT_REFRESH_SECRET` and secrets
  under 32 chars in production. Add new required env vars there, not just to `.env.example`.

## Prisma specifics (v7 — differs from what you may know)

- Client generator is `prisma-client-js` with **no custom `output`** — it generates into
  `node_modules/@prisma/client` deliberately. A `src/`-relative output breaks
  `nest start --watch`, because tsc's watcher only tracks `.ts` files it compiles, not
  the non-TS artifacts (`.wasm`, engine binaries) Prisma also generates alongside them.
- `PrismaClient` requires an explicit driver adapter now (`@prisma/adapter-pg`,
  wired in `PrismaService`'s constructor from `ConfigService`) — it no longer reads
  `DATABASE_URL` implicitly.
- Migrations: `pnpm exec prisma migrate dev --name <description>` locally (against the
  Dockerized Postgres on `localhost:5433`, per `.env`). Never edit a generated migration
  file by hand.

## Docker

`docker-compose.yml` at the monorepo root builds `apps/backend/Dockerfile` with build
**context set to the repo root**, not `apps/backend/` — required so pnpm can see the
workspace lockfile. The `dev` stage runs as root (the bind-mounted source directory is
host-owned, so a non-root container user can't write there); the `prod` stage — what
actually ships — runs as an unprivileged `app` user with no build tooling.

## Before writing new modules

Skim the `backend-conventions` skill (points here) and the `nestjs-project-structure`
skill (reference material on feature-module layout, DTO/entity separation, config
validation, and common anti-patterns) before scaffolding a new feature.
