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
RUN pnpm prune --prod

# ---- prod: minimal runtime image, non-root, no build tooling ---------------
FROM node:${NODE_VERSION} AS prod
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/apps/backend/node_modules ./node_modules
COPY --from=build /workspace/apps/backend/dist ./dist
COPY --from=build /workspace/apps/backend/prisma ./prisma
COPY --from=build /workspace/apps/backend/package.json ./package.json
USER app
EXPOSE 3001
CMD ["node", "dist/main.js"]
