# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT (see docker-compose.yml's `context: .`
# for the backend, same reasoning here), not this directory — required so
# pnpm can see the workspace lockfile and resolve apps/frontend as a
# workspace package.

ARG NODE_VERSION=22-alpine

# ---- base: shared pnpm setup ----------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable
WORKDIR /workspace
RUN addgroup -S app && adduser -S app -G app

# ---- deps: install once, reused by the build stage -------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile --filter comitai-frontend...

# ---- build: compile the Next.js app -----------------------------------------
FROM base AS build
ENV NODE_ENV=production
# Next.js reads NEXT_PUBLIC_* at build time and inlines it into the client
# bundle — must be supplied as a build arg, not just a runtime env var.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/frontend/node_modules ./apps/frontend/node_modules
COPY apps/frontend ./apps/frontend
WORKDIR /workspace/apps/frontend
RUN pnpm run build

# ---- prod: minimal runtime image, non-root ----------------------------------
# NOT using .next/standalone here: Next.js's output-file-tracing has a known
# gap with pnpm's symlinked store (github.com/vercel/next.js — standalone
# builds sometimes omit ESM-only files like @swc/helpers/esm/*, causing a
# MODULE_NOT_FOUND crash at boot that only shows up at runtime, not build
# time). Shipping the full pruned node_modules avoids the tracer entirely,
# at the cost of a larger image — worth it until that gap is fixed upstream.
FROM base AS prod
ENV NODE_ENV=production
WORKDIR /workspace/apps/frontend
COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/apps/frontend/node_modules ./node_modules
COPY --from=build /workspace/apps/frontend/.next ./.next
COPY --from=build /workspace/apps/frontend/public ./public
COPY --from=build /workspace/apps/frontend/package.json ./package.json
COPY --from=build /workspace/apps/frontend/next.config.ts ./next.config.ts
USER app
EXPOSE 3000
# Runs `next start` directly rather than `pnpm run start`: the latter
# triggers pnpm's "does node_modules match the lockfile" status check on
# every invocation (see apps/backend/Dockerfile's dev stage for the same
# issue), which tries to write a temp file in this directory — owned by
# root from the COPY above, unwritable by the non-root `app` user — and
# crashes the container before Next.js ever starts.
CMD ["node_modules/.bin/next", "start"]
