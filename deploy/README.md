# Deploy do Build-Plan — AWS EC2 (API + Postgres) e Vercel (frontend)

```
Navegador ──HTTPS──> Vercel (frontend React, estático)
     │
     └────HTTPS──> EC2 Ubuntu
                    ├─ Nginx (80/443, certificado Let's Encrypt)
                    │    └─> 127.0.0.1:3333
                    └─ Docker Compose
                         ├─ api      (Node 22, sem root)
                         └─ postgres (17, sem porta exposta)
```

Arquivos desta pasta:

| Arquivo | Para quê |
|---|---|
| `docker-compose.prod.yml` | Sobe Postgres 17, aplica as migrações e inicia a API |
| `.env.example` | Modelo do `.env` de produção (segredos) |
| `nginx.conf.example` | Reverse proxy do Nginx para a API |
| `backup.sh` | Backup do banco com rotação (manual ou via cron) |

## Antes de começar

- **Um domínio (ou subdomínio) para a API**, por exemplo `api.seu-dominio.com`.
  Ele é obrigatório: o frontend na Vercel roda em HTTPS, e o navegador bloqueia
  chamadas a uma API em HTTP. O certificado (Certbot) só é emitido para um nome,
  não para um IP. Sem domínio próprio, um subdomínio gratuito (ex.: DuckDNS) serve.
- Conta na AWS e na Vercel, e o repositório no GitHub.

## 1. Criar a instância EC2

- [ ] **AMI:** Ubuntu Server 24.04 LTS (64-bit x86).
- [ ] **Tipo:** `t3.small` (2 GB de RAM). A `t3.micro` (1 GB) funciona, mas só com o swap do passo 3.
- [ ] **Disco:** 20 GB gp3.
- [ ] **Par de chaves:** crie um e guarde o `.pem` (é a única forma de entrar na máquina).
- [ ] **Elastic IP:** aloque um e associe à instância (o IP comum muda a cada reinício).

### Security Group (firewall da AWS)

| Porta | Origem | Motivo |
|---|---|---|
| 22 (SSH) | **Meu IP** | Administração. Nunca `0.0.0.0/0`. |
| 80 (HTTP) | `0.0.0.0/0` | Emissão/renovação do certificado e redirect para HTTPS |
| 443 (HTTPS) | `0.0.0.0/0` | A API |

Nada além disso. As portas **3333** (Node) e **5432** (Postgres) ficam fechadas:
só o Nginx fala com a API, e só a API fala com o banco.

## 2. Apontar o DNS

- [ ] No provedor do domínio, crie um registro **A**: `api` → Elastic IP.
- [ ] Confirme: `nslookup api.seu-dominio.com` deve devolver o Elastic IP.

## 3. Preparar o servidor

```bash
ssh -i sua-chave.pem ubuntu@api.seu-dominio.com

sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx git
sudo usermod -aG docker ubuntu && newgrp docker

# Swap de 2 GB (evita falta de memória durante o build da imagem)
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Subir a API e o banco

```bash
git clone https://github.com/FernandoLML/Build-Plan.git
cd Build-Plan/deploy
cp .env.example .env

openssl rand -hex 24      # cole em POSTGRES_PASSWORD
openssl rand -base64 48   # cole em JWT_SECRET
nano .env                 # cole os dois segredos
chmod 600 .env

docker compose -f docker-compose.prod.yml up -d --build
```

`CORS_ORIGINS` pode ficar com o valor do exemplo por enquanto: a URL real da Vercel
só existe no passo 7, e é lá que ela é trocada. O valor precisa ser sempre uma
origem válida (`https://`, minúsculas, sem barra no final), senão a API não inicia.

O primeiro build leva alguns minutos. As migrações rodam sozinhas antes de a API
iniciar (incluindo a extensão `pg_trgm`, usada na busca do SINAPI).

- [ ] `docker compose -f docker-compose.prod.yml ps` mostra `api` e `postgres` como **healthy**.
- [ ] `curl http://127.0.0.1:3333/api/health` responde `{"status":"ok",...}`.

Se a API não subir, veja o motivo com `docker compose -f docker-compose.prod.yml logs api`.
Ela se recusa a iniciar em produção com segredo fraco ou `CORS_ORIGINS` sem `https://`,
e o log diz qual variável corrigir.

## 5. Nginx e HTTPS

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/buildplan
sudo sed -i 's/api.SEU-DOMINIO.com/api.seu-dominio.com/g' /etc/nginx/sites-available/buildplan
sudo ln -s /etc/nginx/sites-available/buildplan /etc/nginx/sites-enabled/buildplan
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d api.seu-dominio.com   # escolha redirecionar HTTP -> HTTPS
```

- [ ] `curl https://api.seu-dominio.com/api/health` responde `ok` de fora da máquina.
- [ ] `sudo certbot renew --dry-run` passa (a renovação automática já fica agendada).

## 6. Importar o catálogo SINAPI

```bash
docker compose -f docker-compose.prod.yml --profile tools run --rm sinapi
```

Importa `backend/prisma/seed/sinapi/SINAPI 202609 SC.xlsx` (cerca de 4 mil insumos).
Rodar de novo substitui a mesma competência, sem duplicar.

## 7. Frontend na Vercel

- [ ] **Add New > Project** e importe o repositório.
- [ ] **Root Directory:** `frontend` (o `vercel.json` de lá cuida do resto).
- [ ] **Environment Variables:** `VITE_API_URL` = `https://api.seu-dominio.com/api`.
      Sem ela (ou sem `https://`) o build falha de propósito.
- [ ] Deploy. Anote a URL final (ex.: `https://build-plan.vercel.app`).
- [ ] Na EC2, coloque essa URL em `CORS_ORIGINS` no `deploy/.env` (sem barra no
      final) e recrie a API: `docker compose -f docker-compose.prod.yml up -d`.

A variável `VITE_API_URL` é embutida no build: se mudar, faça **Redeploy** na Vercel.

## 8. Conferência final

- [ ] Criar conta e fazer login pelo site da Vercel.
- [ ] Atualizar a página (F5) numa rota interna, como `/obras`: não pode dar 404.
- [ ] Buscar um insumo SINAPI e exportar uma lista de compras em `.xlsx` e `.pdf`.
- [ ] `curl -I http://IP-DA-EC2:3333` e `:5432` de fora **não** respondem.

## Operação

```bash
cd ~/Build-Plan/deploy

# Atualizar para a última versão da main
git pull && docker compose -f docker-compose.prod.yml up -d --build

# Logs
docker compose -f docker-compose.prod.yml logs -f api
```

O frontend não precisa de comando: a Vercel publica sozinha a cada push na `main`.

Os contêineres voltam sozinhos após reinício da máquina (`restart: unless-stopped`).
Os dados do banco ficam no volume `buildplan-prod_postgres_data`; nunca use
`down -v` em produção, pois isso apaga o volume.

### Backup do banco

O `backup.sh` gera `~/backups/buildplan-AAAA-MM-DD-HHMM.sql.gz`, confere se o dump
está íntegro e apaga os arquivos com mais de 14 dias.

```bash
# Uma vez, para testar
~/Build-Plan/deploy/backup.sh

# Agendar: todo dia às 06:00 UTC (03:00 de Brasília)
mkdir -p ~/backups
( crontab -l 2>/dev/null; echo '0 6 * * * $HOME/Build-Plan/deploy/backup.sh >> $HOME/backups/backup.log 2>&1' ) | crontab -
crontab -l
```

- [ ] `tail ~/backups/backup.log` mostra uma linha `OK:` por dia.

Esses arquivos ficam no disco da própria EC2: cobrem erro humano e dado corrompido,
mas não a perda da máquina. Para ter uma cópia fora dela:

```powershell
# No seu computador: baixa os backups para a pasta atual
scp -i .\sua-chave.pem "ubuntu@api.seu-dominio.com:backups/*.sql.gz" .
```

Outra opção, sem comando nenhum, são os snapshots automáticos do disco:
console da AWS > EC2 > **Lifecycle Manager** > política de snapshot do EBS.

**Restaurar** (substitui os dados atuais pelos do arquivo):

```bash
cd ~/Build-Plan/deploy
docker compose -f docker-compose.prod.yml stop api
gunzip -c ~/backups/buildplan-AAAA-MM-DD-HHMM.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose -f docker-compose.prod.yml start api
```

### Pausar e religar

A aplicação fica no ar 24 horas; não há nada para ligar ou desligar no dia a dia.
Para parar de pagar pela instância por um tempo, use **Stop** no console da EC2
(os dados ficam no disco) e **Start** para voltar: API e banco sobem sozinhos.
Enquanto a instância está parada, o disco e o Elastic IP continuam sendo cobrados.

Nunca use **Terminate**: ele apaga a máquina e o disco com o banco.

## Limites conhecidos

- O rate limit guarda os contadores em memória: vale para **uma** instância da API
  e zera quando ela reinicia. Com mais de uma instância, seria preciso um store
  compartilhado (Redis).
- O backup agendado fica na mesma máquina; a cópia externa (download ou snapshot
  do EBS) depende de configuração à parte.
- O workflow `sinapi-import.yml` do GitHub Actions não alcança este banco (a porta
  5432 não é pública): a importação do SINAPI em produção é o comando do passo 6.
- `/metrics` ainda não existe na API; o Nginx já o deixa restrito à própria máquina.
