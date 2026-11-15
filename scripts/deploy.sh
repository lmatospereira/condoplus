#!/usr/bin/env bash
# Deploy manual na VPS (o caminho normal é o workflow .github/workflows/deploy.yml).
# Uso, na VPS:  ~/condoplus/deploy.sh [tag]     (padrão: latest)
# Baixa o docker-compose.prod.yml da versão, puxa a imagem do GHCR, sobe e
# confere o /api/health.
set -euo pipefail

REPO="lmatospereira/condoplus"
TAG="${1:-latest}"
REF="main"
[[ "$TAG" =~ ^[0-9a-f]{40}$ ]] && REF="$TAG"
[[ "$TAG" =~ ^v[0-9] ]] && REF="$TAG"

cd "$(dirname "$0")"
curl -fsSL "https://raw.githubusercontent.com/${REPO}/${REF}/docker-compose.prod.yml" -o docker-compose.yml
export IMAGE_TAG="$TAG"
docker compose pull app
docker compose up -d

for _ in $(seq 1 60); do
  status=$(docker inspect --format '{{.State.Health.Status}}' condoplus-app-1 2>/dev/null || echo starting)
  [[ "$status" == healthy ]] && break
  sleep 5
done
docker compose ps
if [[ "$status" != healthy ]]; then
  docker compose logs --tail 80 app
  exit 1
fi
docker image prune -f >/dev/null
echo "condoplus ($TAG) no ar."
