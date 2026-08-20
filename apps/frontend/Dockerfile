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
# next.config.ts sets output: "standalone", so the build stage already
# produces a self-contained server bundle with only the node_modules
# actually needed at runtime — no separate prune/install step required.
FROM node:${NODE_VERSION} AS prod
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /workspace/apps/frontend/.next/standalone ./
COPY --from=build /workspace/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /workspace/apps/frontend/public ./apps/frontend/public
USER app
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
