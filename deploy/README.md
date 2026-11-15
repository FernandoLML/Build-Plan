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
nano .env                 # preencha também CORS_ORIGINS (URL da Vercel, passo 7)

docker compose -f docker-compose.prod.yml up -d --build
```

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

# Backup do banco (guarde o arquivo fora da EC2)
docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backup-$(date +%F).sql.gz
```

Os contêineres voltam sozinhos após reinício da máquina (`restart: unless-stopped`).
Os dados do banco ficam no volume `buildplan-prod_postgres_data`; nunca use
`down -v` em produção, pois isso apaga o volume.

## Limites conhecidos

- O rate limit guarda os contadores em memória: vale para **uma** instância da API
  e zera quando ela reinicia. Com mais de uma instância, seria preciso um store
  compartilhado (Redis).
- Não há backup automático: o comando acima é manual. Para algo recorrente, use um
  `cron` enviando o arquivo para o S3, ou snapshots do volume EBS.
- `/metrics` ainda não existe na API; o Nginx já o deixa restrito à própria máquina.
