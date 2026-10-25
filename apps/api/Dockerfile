# Multi-stage Dockerfile for Nexus API Backend
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY database ./database

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/types/dist ./packages/types/dist
COPY apps/api/package.json ./apps/api/
COPY apps/api/dist ./apps/api/dist
COPY database/migrations ./database/migrations

RUN pnpm install --prod --frozen-lockfile

EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
