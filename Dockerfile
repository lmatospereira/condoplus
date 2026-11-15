# syntax=docker/dockerfile:1
# Imagem de produção (linux/arm64 na VPS OCI). Next.js standalone + Prisma migrate.

# ---------------------------------------------------------------------------
# 1. Dependências (o postinstall roda `prisma generate`)
# ---------------------------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
# Só para o `prisma generate`/build: o valor real vem do .env em runtime.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---------------------------------------------------------------------------
# 2. Build do Next.js
# ---------------------------------------------------------------------------
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------------
# 3. CLI do Prisma isolada, só para `prisma migrate deploy` no start
# ---------------------------------------------------------------------------
FROM node:22-slim AS migrator
WORKDIR /migrate
COPY package.json ./package.root.json
RUN PRISMA_VERSION=$(node -p "require('./package.root.json').devDependencies.prisma.replace(/^[^0-9]*/, '')") \
 && DOTENV_VERSION=$(node -p "require('./package.root.json').devDependencies.dotenv.replace(/^[^0-9]*/, '')") \
 && npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund "prisma@${PRISMA_VERSION}" "dotenv@${DOTENV_VERSION}" \
 && rm package.root.json

# ---------------------------------------------------------------------------
# 4. Runtime
# ---------------------------------------------------------------------------
FROM node:22-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=UTC

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=migrator --chown=node:node /migrate/node_modules ./migrate/node_modules
COPY --chown=node:node prisma ./migrate/prisma
COPY --chown=node:node prisma.config.ts ./migrate/prisma.config.ts
COPY --chown=node:node docker/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY --chown=node:node VERSION ./VERSION

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
