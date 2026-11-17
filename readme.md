# Build-Plan

## Sistema Web de Apoio à Gestão da Construção Civil

O **Build-Plan** é uma plataforma desenvolvida para centralizar e digitalizar o fluxo de informações entre o planejamento técnico e a execução no canteiro de obras.

O foco principal é transformar documentos estáticos, como o *Memorial Descritivo*, em uma estrutura de dados dinâmica para controle de insumos e etapas.

**Aplicação em produção:** https://build-plan-two.vercel.app

---

## O Problema

Na construção civil de pequeno e médio porte, a ausência de planejamento estruturado gera:

- Desperdícios
- Atrasos
- Custos imprevistos

Atualmente, o fluxo de informação entre escritório e obra é:

- Descontínuo
- Dependente de planilhas fragmentadas
- Baseado em documentos físicos

Isso dificulta a rastreabilidade eficiente dos materiais.

O **Build-Plan** resolve esse problema ao transformar informações de projeto em uma estrutura digital que apoia a decisão de compras e a execução da obra.

---

## Objetivos

### Objetivo Geral

Desenvolver um sistema de apoio à gestão da construção capaz de:

- Organizar etapas
- Gerenciar materiais
- Identificar necessidades de compra

Tudo isso a partir de cadastro manual e informações de documentos técnicos.

### Objetivos Específicos

- Modelar um sistema que atue como ponte entre documentação técnica e execução operacional
- Implementar módulos de extração assistida de materiais baseados em memoriais descritivos
- Gerar listas de compras automatizadas por fase da obra

---

## Funcionalidades

- **Obras e etapas**
  Cadastro de obras e organização em etapas (fundação, alvenaria, acabamento etc.), com isolamento por usuário

- **Cronograma e tarefas**
  Tarefas por etapa, com status, datas previstas e progresso físico

- **Importação de Memorial**
  Leitura de um arquivo CSV do Memorial Descritivo, com revisão dos itens antes de importar

- **Catálogo de materiais**
  Materiais da obra com especificação, unidade, quantidade e código SINAPI

- **Vínculo Material x Etapa e rastreabilidade**
  Cada material vinculado a uma etapa avança de *Previsto* para *Recebido* e *Aplicado*, com histórico de quem alterou e quando

- **Listas de compras**
  Geradas por etapa, com preços preenchidos automaticamente pela tabela SINAPI ou informados manualmente

- **Exportação**
  Lista de compras em Excel (`.xlsx`, com fórmulas), PDF e CSV

- **Dashboard**
  Indicadores da obra: progresso das tarefas, situação dos materiais e total orçado

---

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, Vite, TypeScript, TanStack Query, Tailwind CSS, shadcn/ui |
| Backend | Node.js 22, Express, TypeScript, Prisma, Zod, JWT |
| Banco de dados | PostgreSQL (extensão `pg_trgm` para a busca no SINAPI) |
| Testes | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
| Qualidade | ESLint, GitHub Actions e SonarCloud (Quality Gate obrigatório nos PRs) |
| Produção | AWS EC2 (API e banco em Docker, atrás de Nginx com HTTPS) e Vercel (frontend) |

---

## Arquitetura em produção

```
Navegador ──HTTPS──> Vercel (frontend React, estático)
     │
     └────HTTPS──> AWS EC2 (Ubuntu)
                    ├─ Nginx (certificado Let's Encrypt)
                    └─ Docker Compose
                         ├─ API Node (Express)
                         └─ PostgreSQL 17
```

A API aplica cabeçalhos de segurança (helmet), CORS restrito ao endereço do frontend, limite de requisições por IP e validação das variáveis de ambiente na inicialização.

O passo a passo completo do deploy está em [deploy/README.md](deploy/README.md).

---

## Como rodar localmente

Pré-requisitos: **Node.js 22**, **Docker** e **Git**.

### 1. Banco de dados

Crie um arquivo `.env` na raiz do repositório:

```env
POSTGRES_USER=buildplan
POSTGRES_PASSWORD=buildplan_dev_password
POSTGRES_DB=buildplan_db
POSTGRES_PORT=5432
PGADMIN_DEFAULT_EMAIL=admin@buildplan.com
PGADMIN_DEFAULT_PASSWORD=admin
PGADMIN_PORT=5050
```

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:deploy     # cria as tabelas
npm run dev               # API em http://localhost:3333
```

Para carregar o catálogo SINAPI (necessário para a busca de preços), no PowerShell:

```powershell
$env:SINAPI_SOURCE="prisma/seed/sinapi/SINAPI 202609 SC.xlsx"; npm run sinapi:import
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### Testes

```bash
cd backend && npm test     # usa um schema separado (.env.test), não o banco de desenvolvimento
cd frontend && npm test
```

O backend precisa de um arquivo `backend/.env.test` apontando para um banco ou schema cujo nome contenha `test` (por exemplo, a mesma `DATABASE_URL` do `.env` com `?schema=test_buildplan`). Os testes se recusam a rodar fora disso, pois apagam os dados a cada caso.

---

## Estrutura de Pastas

| Pasta | Conteúdo |
|---|---|
| `backend/` | API REST (Express + Prisma), migrações e importador SINAPI |
| `frontend/` | Aplicação web (React + Vite) |
| `deploy/` | Arquivos e guia de produção: Docker Compose, Nginx, backup |
| `Docs/` | RFC, diagramas e documentação técnica |
| `.github/workflows/` | Integração contínua (lint, testes, SonarCloud) |

Documentação técnica detalhada: [Docs/arquitetura-raio-x.md](Docs/arquitetura-raio-x.md).

---

# Sugestão de Melhoria (revisão por Pares)

Bruno Luis Pereira - Sugiro criar um sistema de notificações que avise o usuário quando uma etapa está prestes a começar (ex: 15 dias antes), gerando automaticamente a ordem de compra dos materiais necessários para evitar atrasos.

Bruno Franzosi - Seria interessante permitir que o usuário importe preços de referência da tabela SINAPI (Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil) para que a estimativa de custos não dependa apenas de inserção manual.
