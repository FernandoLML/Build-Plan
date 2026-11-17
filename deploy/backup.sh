#!/usr/bin/env bash
# Caminho: /deploy/backup.sh
# Backup do Postgres de produção: gera um dump compactado e apaga os antigos.
#
#   ./backup.sh                      # manual
#   0 6 * * * .../deploy/backup.sh   # diário via cron (ver deploy/README.md)
#
# Variáveis opcionais:
#   BACKUP_DIR            pasta de destino            (padrão: ~/backups)
#   BACKUP_RETENCAO_DIAS  dias que um dump é mantido  (padrão: 14)
#
# Os arquivos ficam no disco da própria EC2: protegem contra erro humano e dado
# corrompido, não contra a perda da máquina. Guarde cópias fora dela.

set -euo pipefail
umask 077 # os dumps contêm dados de usuários: só o dono lê

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
DESTINO="${BACKUP_DIR:-$HOME/backups}"
RETENCAO_DIAS="${BACKUP_RETENCAO_DIAS:-14}"

mkdir -p "$DESTINO"
arquivo="$DESTINO/buildplan-$(date +%F-%H%M).sql.gz"
parcial="$arquivo.parcial"
trap 'rm -f "$parcial"' EXIT

# --clean --if-exists: o dump pode ser restaurado por cima de um banco existente.
docker compose -f "$DEPLOY_DIR/docker-compose.prod.yml" exec -T postgres \
  sh -c 'pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$parcial"

# Só vale como backup se o arquivo estiver íntegro e o dump tiver ido até o fim.
gzip -t "$parcial"
if ! gzip -dc "$parcial" | tail -n 5 | grep -q "PostgreSQL database dump complete"; then
  echo "$(date -Is) ERRO: dump incompleto, backup descartado." >&2
  exit 1
fi
mv "$parcial" "$arquivo"

# Rotação: só apaga os antigos depois que o novo foi validado.
find "$DESTINO" -maxdepth 1 -name 'buildplan-*.sql.gz' -mtime +"$RETENCAO_DIAS" -delete

echo "$(date -Is) OK: $arquivo ($(du -h "$arquivo" | cut -f1))"
