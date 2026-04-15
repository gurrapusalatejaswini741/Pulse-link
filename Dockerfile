FROM node:24-slim AS base

RUN npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json tsconfig.json ./

COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/integrations-gemini-ai/package.json ./lib/integrations-gemini-ai/
COPY artifacts/api-server/package.json ./artifacts/api-server/

FROM base AS deps
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/pulse-link/ ./artifacts/pulse-link/

RUN pnpm run typecheck:libs
RUN pnpm --filter @workspace/api-server run build

FROM node:24-slim AS runner
RUN npm install -g pnpm@10
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/integrations-gemini-ai/package.json ./lib/integrations-gemini-ai/
COPY artifacts/api-server/package.json ./artifacts/api-server/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
