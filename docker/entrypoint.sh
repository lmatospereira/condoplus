#!/bin/sh
set -eu

echo "[entrypoint] aplicando migrations (prisma migrate deploy)…"
cd /app/migrate
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] iniciando a Zelora v$(cat /app/VERSION 2>/dev/null || echo '?')"
cd /app
exec node server.js
