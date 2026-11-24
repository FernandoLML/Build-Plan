# Deploy do Build-Plan — AWS EC2 (API + Postgres) e Vercel (frontend)

```
Navegador ──HTTPS──> Vercel (frontend React, estático)
     │
     └────HTTPS──> EC2 Ubuntu
                    ├─ Nginx (80/443, certificado Let's Encrypt)
                    │    └─> 127.0.0.1:3333
                    └─ Docker Compose
                         ├─ api        (Node 22, sem root)
                         ├─ postgres   (17, sem porta exposta)
                         ├─ prometheus (métricas; só em 127.0.0.1)
                         └─ grafana    (painéis; só em 127.0.0.1)

GitHub Actions ──imagens──> GHCR ──pull──> EC2   (deploy automático, via AWS SSM)
```

Arquivos desta pasta:

| Arquivo | Para quê |
|---|---|
| `docker-compose.prod.yml` | Sobe Postgres 17, aplica as migrações e inicia a API |
| `.env.example` | Modelo do `.env` de produção (segredos) |
| `nginx.conf.example` | Reverse proxy do Nginx para a API |
| `backup.sh` | Backup do banco com rotação (manual ou via cron) |
| `deploy.sh` | Atualiza a API com as imagens publicadas pelo CI (usado pelo deploy automático e para rollback) |
| `verificar-producao.sh` | Confere de uma vez contêineres, versão, métricas, Grafana, bloqueio do `/metrics`, backup e memória |
| `prometheus.yml` | Configuração do Prometheus: coleta as métricas da API a cada 15 s |
| `grafana/` | Datasource e dashboard do Grafana, carregados automaticamente |

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

## 9. Deploy automático (GitHub Actions)

Depois desta configuração, **todo merge na `main` publica sozinho**: o job `deploy`
do `ci.yml` só roda se os testes e o Quality Gate do SonarCloud passarem. Ele
constrói as imagens, publica no GHCR (registro de imagens do GitHub) e manda a EC2
executar o `deploy.sh`. Ninguém entra na máquina.

```
push na main ─> testes + SonarCloud ─> build das imagens ─> GHCR
                                                              │
              EC2: deploy.sh  <── AWS SSM (Run Command) <─────┘
              (pull das imagens, migrações, API, health-check)
```

O comando chega à EC2 pelo **AWS Systems Manager (SSM)**, não por SSH: a porta 22
continua liberada só para o seu IP. O GitHub se autentica na AWS por **OIDC**, uma
credencial temporária emitida a cada execução. Não existe chave da AWS guardada no
GitHub.

### 9.1 Permitir que a EC2 receba comandos do SSM

- [ ] Console da AWS > **IAM > Roles > Create role** > *AWS service* > **EC2**.
      Política: `AmazonSSMManagedInstanceCore`. Nome: `buildplan-ec2-ssm`.
- [ ] **EC2 > Instances** > selecione a instância > *Actions > Security > Modify IAM role*
      > escolha `buildplan-ec2-ssm`.
- [ ] Após alguns minutos, a instância aparece em **Systems Manager > Fleet Manager**.
      Se não aparecer: `sudo snap restart amazon-ssm-agent` na EC2.

### 9.2 Permitir que o GitHub Actions dispare o deploy

- [ ] **IAM > Identity providers > Add provider** > *OpenID Connect*.
      URL: `https://token.actions.githubusercontent.com` · Audience: `sts.amazonaws.com`.
- [ ] **IAM > Roles > Create role** > *Web identity* > o provedor acima.
      Organização `FernandoLML`, repositório `Build-Plan`, branch `main`.
      Nome: `buildplan-github-deploy`. Sem política por enquanto.
- [ ] Na role criada, *Add permissions > Create inline policy* (JSON), trocando
      `REGIAO`, `CONTA` e `ID-DA-INSTANCIA`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ssm:REGIAO::document/AWS-RunShellScript",
        "arn:aws:ec2:REGIAO:CONTA:instance/ID-DA-INSTANCIA"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "ssm:GetCommandInvocation",
      "Resource": "*"
    }
  ]
}
```

A role só pode executar comandos **nesta** instância, e só pode ser assumida por
execuções da branch `main` deste repositório (confira em *Trust relationships* que a
condição `sub` é `repo:FernandoLML/Build-Plan:ref:refs/heads/main`).

### 9.3 Variáveis no GitHub

Repositório > **Settings > Secrets and variables > Actions > Variables**:

| Variable | Valor |
|---|---|
| `AWS_REGION` | região da instância, ex.: `us-east-2` |
| `AWS_DEPLOY_ROLE_ARN` | ARN da role `buildplan-github-deploy` |
| `EC2_INSTANCE_ID` | id da instância, ex.: `i-0abc123...` |

São *variables*, não *secrets*: nenhuma delas dá acesso a nada sozinha. Enquanto não
estiverem definidas, o job só publica as imagens e avisa que pulou a EC2.

### 9.4 Tornar as imagens públicas

O primeiro deploy cria dois pacotes no GitHub: `build-plan-api` e `build-plan-tools`.
Eles nascem privados, e a EC2 não conseguiria baixá-los.

- [ ] Perfil do GitHub > **Packages** > abra cada pacote > *Package settings* >
      **Change visibility > Public**. O código já é público; as imagens não contêm segredos
      (eles ficam no `deploy/.env` da EC2).
- [ ] Em **Actions**, reexecute o job `deploy` (*Re-run failed jobs*).

### 9.5 Conferir

- [ ] O job `deploy` termina verde e o log mostra `OK: API no ar (<commit>)`.
- [ ] Na EC2, `grep IMAGE ~/Build-Plan/deploy/.env` mostra as imagens do commit publicado.

**Voltar para uma versão anterior** (rollback), na EC2, com o hash completo do commit:

```bash
~/Build-Plan/deploy/deploy.sh <hash-do-commit>
```

## Operação

```bash
cd ~/Build-Plan/deploy

# Logs
docker compose -f docker-compose.prod.yml logs -f api

# Estado dos contêineres
docker compose -f docker-compose.prod.yml ps
```

Para conferir tudo de uma vez (só lê, não altera nada; sai com o número de falhas):

```bash
~/Build-Plan/deploy/verificar-producao.sh api.seu-dominio.com
```

A API é atualizada pelo deploy automático (passo 9) a cada merge na `main`, e o
frontend pela Vercel. Se precisar atualizar à mão (por exemplo, com o GitHub fora do ar):

```bash
git pull && ./deploy.sh latest          # usa a última imagem publicada
# ou, construindo na própria máquina (lento na t3.micro):
git pull && docker compose -f docker-compose.prod.yml up -d --build
```

Depois de mudar o `nginx.conf.example`, replique a alteração em
`/etc/nginx/sites-available/buildplan` (o Certbot editou esse arquivo, então não o
sobrescreva) e rode `sudo nginx -t && sudo systemctl reload nginx`.

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

### E-mail (recuperação de senha)

O "esqueci minha senha" envia um link por e-mail. Sem SMTP configurado a API funciona
normalmente, mas o link não é enviado (o log registra `SMTP não configurado`).

- [ ] Crie uma conta em um provedor SMTP (Brevo, Amazon SES, Mailgun, ou Gmail com
      senha de app) e valide o remetente.
- [ ] No `deploy/.env`: `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASS` e
      `EMAIL_REMETENTE`. O link usa `FRONTEND_URL` ou, na falta dela, a primeira
      origem de `CORS_ORIGINS`.
- [ ] `docker compose -f docker-compose.prod.yml up -d` e teste pelo site.

A AWS bloqueia a porta 25 de saída nas instâncias EC2; use 587 ou 465.

### Observabilidade (Prometheus + Grafana)

A API expõe métricas em `/metrics` (requisições por rota, latência, status, memória e
CPU do Node.js). O Prometheus coleta a cada 15 s pela rede interna do Docker, e o
Grafana já sobe com o datasource e o dashboard **Build-Plan · API** prontos.

```bash
cd ~/Build-Plan/deploy
echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -hex 16)" >> .env
echo "COMPOSE_PROFILES=observability" >> .env   # mantém os dois serviços em todo `up -d`
docker compose -f docker-compose.prod.yml up -d
```

Nenhum dos dois fica na internet: escutam só em `127.0.0.1`, e o Security Group não
muda. Para abrir os painéis, crie um **túnel SSH** a partir do seu computador:

```powershell
ssh -i .\sua-chave.pem -L 3000:127.0.0.1:3000 -L 9090:127.0.0.1:9090 ubuntu@api.seu-dominio.com
```

Com o túnel aberto:

- Grafana: <http://localhost:3000> (usuário `admin`, senha do `.env`)
- Prometheus: <http://localhost:9090/targets> (o alvo `buildplan-api` deve estar **UP**)

- [ ] `curl -s https://api.seu-dominio.com/metrics` de fora responde **404**.
- [ ] `curl -s http://127.0.0.1:3333/metrics | head` na EC2 mostra as métricas.

O `/metrics` tem duas barreiras: o Nginx devolve 404 para qualquer `/metrics*`, e a
própria API recusa a rota quando a requisição chega por um proxy. **Atualize o Nginx
da EC2** com o bloco `location ~* ^/metrics` do `nginx.conf.example`.

Consumo: cerca de 200 MB para o Grafana e 30 a 80 MB para o Prometheus, com limites de
384 MB e 192 MB. Na `t3.micro` isso depende do swap do passo 3. O Prometheus guarda 7
dias ou 300 MB de histórico. Para desligar:
`docker compose -f docker-compose.prod.yml --profile observability stop prometheus grafana`
(e remova `COMPOSE_PROFILES` do `.env`).

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
- Não há alertas: o Grafana mostra os painéis, mas ninguém é avisado se a API cair.
  O próximo passo seria uma regra de alerta (Grafana Alerting) com envio por e-mail.
- Trocar a senha não derruba sessões abertas: o JWT é stateless e continua válido
  até expirar (`JWT_EXPIRES_IN`, 8 h).
