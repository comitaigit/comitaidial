---
name: backend-conventions
description: Comitai backend (apps/backend) coding conventions — NestJS feature modules, Prisma v7 gotchas, and the full JWT auth/security model (argon2, access+refresh rotation, lockout, rate limiting, audit log). Load before adding or changing any code under apps/backend (new module, new endpoint, touching auth, Docker/Prisma changes).
---

# Backend conventions

This app's conventions live in **[apps/backend/AGENTS.md](../../../AGENTS.md)**
(also loaded via `apps/backend/CLAUDE.md`, which is just `@AGENTS.md`) — read it in full
before writing backend code. For frontend code see the `frontend-conventions` skill instead.

It covers:
- **Feature-module architecture**: `src/<feature>/{*.module,*.controller,*.service,dto/}`,
  why controllers stay thin and services never touch `req`/`res` directly.
- **The full security model**: argon2id password hashing, JWT access tokens (opt-out auth
  via `@Public()`), rotating opaque refresh tokens in an httpOnly/Secure/SameSite=Strict
  cookie (and the URI-versioning path gotcha that silently breaks it if misaligned),
  reuse detection, brute-force lockout (rate limiting + persisted per-account lockout),
  enumeration resistance, and the `login_events` audit trail.
- **Prisma v7 specifics**: why the client generator has no custom `output`, and why
  `PrismaClient` needs an explicit `@prisma/adapter-pg` driver adapter now.
- **Docker**: why the compose build context is the monorepo root, and why the `dev` stage
  runs as root while `prod` doesn't.

Do not duplicate that content here — this file is a pointer so the conventions are
discoverable as a skill; **apps/backend/AGENTS.md is the source of truth.** If you update
the conventions, edit that file, not this one.

## Source material

For general NestJS structure questions not specific to this repo's auth implementation,
check these reference skills (verbatim source material, not summarized):

- `nestjs-project-structure` — feature-based vs layered folder structure, module design
  (`@Global()` usage, core/shared modules), DTO vs entity separation, config validation,
  testing layout, error handling, monorepo/microservices notes.
- `nestjs-best-practices` — the five foundational practices (modularize, dependency
  injection, error handling/logging, consistent style, comprehensive tests) with
  before/after code samples.

When AGENTS.md doesn't explicitly cover a judgment call (e.g. "where does this new
feature's module go", "should this be @Global()"), check those skills before improvising.
