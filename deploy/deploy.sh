#!/usr/bin/env bash
# Caminho: /deploy/deploy.sh
# Atualiza a API em produção com as imagens publicadas pelo GitHub Actions.
# É o que o job `deploy` do CI executa na EC2 (via AWS SSM), mas também pode
# ser rodado à mão para voltar a uma versão anterior:
#
#   ./deploy.sh <tag> [repositorio-de-imagens]
#   ./deploy.sh 3f2a1b9c...                 # um commit específico (rollback)
#   ./deploy.sh latest                      # a última imagem da main
#
# O que faz:
#   1. grava em .env quais imagens usar (assim um `docker compose up -d` manual
#      continua na mesma versão);
#   2. baixa as imagens (o build acontece no CI, não nesta máquina);
#   3. recria os contêineres: as migrações rodam antes de a API subir;
#   4. espera a API responder no health-check e falha se ela não subir.

set -euo pipefail

TAG="${1:?uso: ./deploy.sh <tag> [repositorio-de-imagens]}"
REPOSITORIO="${2:-ghcr.io/fernandolml/build-plan}"

cd "$(dirname "$0")"

ENV_FILE=".env"
COMPOSE=(docker compose -f docker-compose.prod.yml)

[ -f "$ENV_FILE" ] || { echo "ERRO: $ENV_FILE não encontrado em $(pwd)." >&2; exit 1; }

# Define VARIAVEL=valor no .env, substituindo a linha se ela já existir.
definir() {
  local nome="$1" valor="$2"
  if grep -q "^${nome}=" "$ENV_FILE"; then
    sed -i "s|^${nome}=.*|${nome}=${valor}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$nome" "$valor" >> "$ENV_FILE"
  fi
}

definir API_IMAGE "${REPOSITORIO}-api:${TAG}"
definir TOOLS_IMAGE "${REPOSITORIO}-tools:${TAG}"

echo "==> Baixando as imagens (${TAG})"
"${COMPOSE[@]}" pull --quiet migrate api

echo "==> Recriando os contêineres"
"${COMPOSE[@]}" up -d --no-build

echo "==> Aguardando a API responder"
for tentativa in $(seq 1 30); do
  if curl -fsS --max-time 3 http://127.0.0.1:3333/api/health > /dev/null; then
    echo "OK: API no ar (${TAG})."
    # Remove imagens antigas sem uso para não encher o disco.
    docker image prune -f > /dev/null
    exit 0
  fi
  sleep 2
done

echo "ERRO: a API não respondeu ao health-check em 60 s." >&2
"${COMPOSE[@]}" ps >&2
"${COMPOSE[@]}" logs --tail 40 api migrate >&2
exit 1
