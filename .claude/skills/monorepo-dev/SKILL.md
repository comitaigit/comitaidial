---
name: monorepo-dev
description: How to run, build, and navigate the Comitai monorepo (apps/frontend Next.js + apps/backend NestJS + Postgres via Docker). Load at the start of any session working from the repo root — before running dev servers, migrations, or deciding which app(s) a task touches.
---

# Comitai monorepo — how it's run

This repo is a pnpm workspace with two apps:

```
comitai/
  apps/
    frontend/   Next.js 16 App Router — see apps/frontend/.claude/skills/frontend-conventions
    backend/    NestJS 11 API — see apps/backend/.claude/skills/backend-conventions
  docker-compose.yml   Postgres + backend containers
  package.json          root orchestration scripts (this file)
```

**Each app has its own skills folder** (`apps/frontend/.claude/skills/`,
`apps/backend/.claude/skills/`) covering that app's architecture and conventions in
depth — load the relevant one(s) once you know which app(s) a task touches. This skill
only covers cross-cutting operation: running things, ports, env vars, and how the pieces
fit together.

## Running everything

```bash
pnpm dev            # starts postgres + backend in Docker, then the frontend dev server
                     # (frontend runs on the host, not in Docker, for fast HMR)
```

Or piece by piece:

```bash
pnpm dev:backend     # docker compose up backend (also brings up postgres via depends_on)
pnpm dev:frontend    # pnpm --filter comitai-frontend dev  — runs on the host
pnpm stop            # docker compose down — stops postgres + backend containers
```

Ports:
- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:3001** (routes are versioned: `http://localhost:3001/v1/...`)
- Postgres: **localhost:5433** (mapped off the default 5432 to avoid colliding with a
  locally-installed Postgres) — connection string lives in `apps/backend/.env`

## Building / linting

```bash
pnpm build:frontend
pnpm build:backend
pnpm lint:frontend
pnpm lint:backend
```

There's no combined `pnpm build`/`pnpm lint` — run both explicitly if a change touches
both apps.

## Database

```bash
pnpm db:migrate      # prisma migrate dev — creates + applies a new migration
pnpm db:studio       # opens Prisma Studio (visual DB browser) against the dev DB
```

Requires postgres running (`pnpm dev:backend` or `docker compose up -d postgres`) first.
See `apps/backend/AGENTS.md`'s Prisma section for schema/generator gotchas specific to
this repo (Prisma v7, driver adapters).

## Environment files

- `apps/frontend/.env.local` — `NEXT_PUBLIC_API_URL` (points at the backend).
- `apps/backend/.env` — `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, CORS
  origins, etc. Copy from `apps/backend/.env.example` and fill real values for anything
  beyond local dev — see `apps/backend/AGENTS.md`'s security section for what each secret
  protects and why access/refresh secrets must differ.

Neither `.env*` file is committed (both gitignored). Docker Compose injects its own
values for the containerized backend (see `docker-compose.yml`'s `environment:` block)
independent of `apps/backend/.env`, which is what `pnpm --filter comitai-backend ...`
(non-Docker) commands read.

## Deciding which app(s) a task touches

- UI, pages, anything rendered in the browser, "the dashboard shows X" → **frontend**.
  Load `apps/frontend/.claude/skills/frontend-conventions`.
- Data persistence, auth, "an API that does X", anything crossing the network to a
  database → **backend**. Load `apps/backend/.claude/skills/backend-conventions`.
- A user-facing feature that needs new data (e.g. "let users do X and see it later") is
  almost always **both**: a backend endpoint/module first, then a frontend feature slice
  that calls it. See the `request-a-feature` skill for the end-to-end flow when someone
  describes a feature in plain language without specifying which side it's on.

## Docker specifics worth knowing

`apps/backend/Dockerfile`'s build **context is the monorepo root** (`context: .` in
`docker-compose.yml`, not `apps/backend`) — it needs the workspace's `pnpm-lock.yaml` to
resolve `comitai-backend` as a workspace package. If you ever add a third app or change
the Dockerfile, keep that context setting; pointing it at `apps/backend/` breaks the
pnpm install step. Full detail in `apps/backend/AGENTS.md`'s Docker section.
