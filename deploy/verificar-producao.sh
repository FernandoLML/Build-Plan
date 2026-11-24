#!/usr/bin/env bash
# Caminho: /deploy/verificar-producao.sh
# Confere, de uma vez, se a produção está como deveria: contêineres, versão da
# API, métricas, Prometheus, Grafana, bloqueio do /metrics na internet, backup
# agendado e memória. Só lê: não altera nada.
#
#   ./verificar-producao.sh                       # checagens internas
#   ./verificar-producao.sh buildplan-api.duckdns.org   # + checagens pela internet
#
# Sai com o número de falhas (0 = tudo certo).
#
# Variáveis opcionais (úteis para testar fora da EC2):
#   API_LOCAL      URL local da API          (padrão: http://127.0.0.1:3333)
#   BACKUP_DIR     pasta dos backups          (padrão: ~/backups)

set -uo pipefail

cd "$(dirname "$0")"
DOMINIO="${1:-}"
API_LOCAL="${API_LOCAL:-http://127.0.0.1:3333}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
COMPOSE=(docker compose -f docker-compose.prod.yml)

falhas=0
ok()    { printf '  \033[32m✔\033[0m %s\n' "$1"; }
falha() { printf '  \033[31m✘\033[0m %s\n' "$1"; falhas=$((falhas + 1)); }
aviso() { printf '  \033[33m!\033[0m %s\n' "$1"; }
titulo() { printf '\n%s\n' "$1"; }

# Valor de uma variável do .env (vazio se não existir).
env_valor() { grep -E "^$1=" .env 2>/dev/null | tail -n 1 | cut -d= -f2-; }

titulo "1. Contêineres"
rodando="$("${COMPOSE[@]}" ps --status running --services 2>/dev/null)"
for servico in postgres api prometheus grafana; do
  if grep -qx "$servico" <<< "$rodando"; then
    ok "$servico rodando"
  else
    falha "$servico não está rodando"
  fi
done
if [[ "$(env_valor COMPOSE_PROFILES)" == *observability* ]]; then
  ok "COMPOSE_PROFILES=observability no .env (Prometheus e Grafana sobem em todo up -d)"
else
  falha "COMPOSE_PROFILES=observability ausente do .env"
fi

titulo "2. Versão e saúde da API"
imagem="$(env_valor API_IMAGE)"
if [[ -n "$imagem" ]]; then ok "imagem: $imagem"; else aviso "API_IMAGE não definida (imagem construída na própria máquina)"; fi
saude="$(curl -fsS --max-time 5 "$API_LOCAL/api/health" 2>/dev/null)"
if [[ "$saude" == *'"status":"ok"'* ]]; then
  ok "health-check responde ($(grep -o '"uptimeSeconds":[0-9]*' <<< "$saude"))"
else
  falha "health-check não respondeu em $API_LOCAL/api/health"
fi
# Rota criada no PR #29: se não existir, a API está numa versão antiga.
codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 -X POST \
  -H 'Content-Type: application/json' -d '{}' "$API_LOCAL/api/auth/esqueci-senha")"
if [[ "$codigo" == "400" ]]; then
  ok "versão atual (rota de recuperação de senha existe)"
else
  falha "versão antiga da API (esqueci-senha respondeu $codigo, esperado 400): rode ./deploy.sh latest"
fi

titulo "3. Métricas"
if curl -fsS --max-time 5 "$API_LOCAL/metrics" 2>/dev/null | grep -q '^http_requests_total'; then
  ok "API expõe /metrics localmente"
else
  falha "API não expõe /metrics em $API_LOCAL/metrics"
fi
alvos="$(curl -fsS --max-time 5 http://127.0.0.1:9090/api/v1/targets 2>/dev/null)"
if grep -q '"job":"buildplan-api"' <<< "$alvos" && ! grep -q '"health":"down"' <<< "$alvos"; then
  ok "Prometheus coletando a API (alvos UP)"
else
  falha "Prometheus sem o alvo buildplan-api UP (veja http://localhost:9090/targets pelo túnel)"
fi
if curl -fsS --max-time 5 http://127.0.0.1:3000/api/health 2>/dev/null | grep -q '"database": *"ok"'; then
  ok "Grafana no ar"
else
  falha "Grafana não respondeu em 127.0.0.1:3000"
fi
if [[ -n "$(env_valor GRAFANA_ADMIN_PASSWORD)" ]]; then
  ok "senha do Grafana definida no .env"
else
  falha "GRAFANA_ADMIN_PASSWORD vazia no .env"
fi

titulo "4. Pela internet"
if [[ -z "$DOMINIO" ]]; then
  aviso "pulado: informe o domínio, ex.: ./verificar-producao.sh buildplan-api.duckdns.org"
else
  if curl -fsS --max-time 10 "https://$DOMINIO/api/health" 2>/dev/null | grep -q '"status":"ok"'; then
    ok "https://$DOMINIO/api/health responde"
  else
    falha "https://$DOMINIO/api/health não respondeu"
  fi
  for caminho in /metrics /Metrics /metrics/ /api/metrics; do
    codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMINIO$caminho")"
    if [[ "$codigo" == "404" || "$codigo" == "403" ]]; then
      ok "$caminho bloqueado de fora ($codigo)"
    else
      falha "$caminho acessível de fora ($codigo)"
    fi
  done
fi

titulo "5. Backup"
if crontab -l 2>/dev/null | grep -q 'backup.sh'; then
  ok "cron do backup agendado: $(crontab -l | grep backup.sh | cut -d' ' -f1-5)"
else
  falha "cron do backup não agendado"
fi
recente="$(find "$BACKUP_DIR" -maxdepth 1 -name 'buildplan-*.sql.gz' -mmin -1560 2>/dev/null | sort | tail -n 1)"
if [[ -n "$recente" ]]; then
  ok "backup das últimas 26 h: $(basename "$recente") ($(du -h "$recente" | cut -f1))"
else
  falha "nenhum backup nas últimas 26 h em $BACKUP_DIR"
fi

titulo "6. Recursos da máquina"
if command -v free > /dev/null; then
  read -r _ total usada _ <<< "$(free -m | grep '^Mem:')"
  read -r _ swap_total swap_usada _ <<< "$(free -m | grep '^Swap:')"
  ok "memória: ${usada}/${total} MB · swap: ${swap_usada}/${swap_total} MB"
  [[ "${swap_total:-0}" -gt 0 ]] || falha "swap desligado (a t3.micro precisa dele com o Grafana)"
fi
uso_disco="$(df -h / | awk 'NR==2 {print $5}')"
ok "disco: ${uso_disco} usado"

titulo "7. Opcionais"
if [[ -n "$(env_valor SMTP_HOST)" ]]; then ok "SMTP configurado"; else aviso "SMTP não configurado: o link de recuperação de senha não é enviado"; fi

printf '\n'
if [[ "$falhas" -eq 0 ]]; then
  printf '\033[32mTudo certo.\033[0m\n'
else
  printf '\033[31m%d falha(s).\033[0m\n' "$falhas"
fi
exit "$falhas"
