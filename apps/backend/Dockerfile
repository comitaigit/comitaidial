# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT (see docker-compose.yml's `context: .`),
# not this directory — required so pnpm can see the workspace lockfile and
# resolve apps/frontend/apps/backend as workspace packages.

ARG NODE_VERSION=22-alpine

# ---- base: shared pnpm setup ----------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable
WORKDIR /workspace
RUN addgroup -S app && adduser -S app -G app

# ---- deps: install once, reused by dev and build stages -------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile --filter comitai-backend...

# ---- dev: hot-reload container used by docker-compose ----------------------
# Runs as root: the docker-compose bind-mount of apps/backend is owned by the
# host user, not the `app` user, and this container never leaves the dev
# machine's Docker network — the `prod` stage below (what actually ships)
# still runs unprivileged.
FROM base AS dev
ENV NODE_ENV=development
# Skips pnpm's "does node_modules match the lockfile" check on every command,
# which otherwise tries to write a temp file even for `pnpm run` and fails
# once the bind-mounted source directory doesn't match the image's owner.
ENV PNPM_DEPS_STATUS_CHECK=false
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/backend/node_modules ./apps/backend/node_modules
COPY apps/backend ./apps/backend
WORKDIR /workspace/apps/backend
RUN pnpm exec prisma generate
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]

# ---- build: compile TypeScript + generate Prisma client --------------------
FROM base AS build
ENV NODE_ENV=production
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/backend/node_modules ./apps/backend/node_modules
COPY apps/backend ./apps/backend
WORKDIR /workspace/apps/backend
RUN pnpm exec prisma generate
RUN pnpm run build
# CI=true skips pnpm's interactive confirmation prompt before removing
# node_modules, which otherwise aborts the build in any non-TTY environment
# (Docker build, CI pipelines).
RUN CI=true pnpm prune --prod

# ---- prod: minimal runtime image, non-root, no build tooling ---------------
# Keeps the same /workspace + apps/backend directory depth as the deps/build
# stages rather than flattening into /app — pnpm's node_modules are
# symlink-based with relative paths computed for that depth (e.g.
# apps/backend/node_modules/@nestjs/common -> ../../../../node_modules/.pnpm/...),
# and flattening the layout breaks those symlinks silently (they resolve
# outside the image, causing a MODULE_NOT_FOUND at boot even though the
# build itself succeeds).
FROM node:${NODE_VERSION} AS prod
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /workspace
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /workspace/apps/backend/dist ./apps/backend/dist
COPY --from=build /workspace/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /workspace/apps/backend/package.json ./apps/backend/package.json
WORKDIR /workspace/apps/backend
USER app
EXPOSE 3001
# nest build (with the default tsconfig rootDir) emits to dist/src/main.js,
# not dist/main.js — verified against the actual build output.
CMD ["node", "dist/src/main.js"]
