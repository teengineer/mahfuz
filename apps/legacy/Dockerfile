# ── Stage 1: Base ──────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Stage 2: Dependencies ─────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/legacy/package.json apps/legacy/
COPY packages/api/package.json packages/api/
COPY packages/audio-engine/package.json packages/audio-engine/
COPY packages/db/package.json packages/db/
COPY packages/gamification/package.json packages/gamification/
COPY packages/memorization/package.json packages/memorization/
COPY packages/sdk/package.json packages/sdk/
COPY packages/shared/package.json packages/shared/
COPY tooling/tailwind/package.json tooling/tailwind/
COPY tooling/typescript/package.json tooling/typescript/
COPY tooling/eslint/package.json tooling/eslint/
RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────
FROM deps AS build
COPY . .
ENV DEPLOY_TARGET=docker
RUN pnpm turbo build --filter=@mahfuz/legacy

# ── Stage 4: Runner ────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy monorepo root for pnpm workspace resolution
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy built app
COPY --from=build /app/apps/legacy/dist apps/legacy/dist
COPY --from=build /app/apps/legacy/drizzle apps/legacy/drizzle
COPY --from=build /app/apps/legacy/server.mjs apps/legacy/server.mjs
COPY --from=build /app/apps/legacy/package.json apps/legacy/

# Copy built packages (needed at runtime for server imports)
COPY --from=build /app/packages/api packages/api
COPY --from=build /app/packages/db packages/db
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/packages/memorization packages/memorization
COPY --from=build /app/packages/gamification packages/gamification
COPY --from=build /app/packages/audio-engine packages/audio-engine
COPY --from=build /app/packages/sdk packages/sdk
COPY --from=build /app/tooling tooling

# Copy node_modules (production)
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/legacy/node_modules apps/legacy/node_modules

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/legacy
CMD ["node", "server.mjs"]
