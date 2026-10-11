# Marco M5 — Camada de Leitura e Saída de Dados
## Documento de Consolidação Técnica

**Projeto:** Build-Plan — Sistema Web de Gestão de Insumos e Etapas de Obra
**Backend:** Node.js + Express + TypeScript (ESM/NodeNext) · PostgreSQL + Prisma · Docker
**Status:** concluído — testes 100% verdes (`tsc --noEmit` + `npm test` com Docker) — pronto para merge na `main`

---

## 1. Resumo Executivo

O Marco M5 entrega a camada de **leitura analítica e exportação** sobre os dados consolidados no M4, habilitando o Dashboard operacional (Tela 2) e fechando o entregável de exportação do RFC M5 (lista de compras). Dividido em dois workstreams:

- **Workstream A — Dashboard da obra:** endpoint de indicadores agregados, com foco primário na distribuição do ciclo de vida dos materiais (vínculos por status) e, como indicador complementar, o progresso físico de tarefas/etapas, além do orçamento consolidado.
- **Workstream B — Exportação CSV:** download da lista de compras em CSV nativo (RFC 4180), com headers HTTP de anexo. A exportação em PDF foi conscientemente adiada para o M7.

---

## 2. Matriz de Endpoints da API (M5)

Rotas protegidas por `authMiddleware` (JWT) — 401 sem token válido. Padrão de ownership: recurso pertence (direta ou indiretamente) ao usuário autenticado; caso contrário, **404**.

| Método | Rota | Sucesso | Erros | Regra / Ownership |
|---|---|---|---|---|
| GET | `/api/obras/:obraId/dashboard` | 200 | 401, 404 | obra do usuário; indicadores agregados |
| GET | `/api/listas-compras/:id/export.csv` | 200 (`text/csv`) | 401, 404 | lista → obra do usuário; download CSV |

### Payload do Dashboard

```jsonc
{
  "obraId": "uuid",
  "etapas":    { "total": number },
  "materiais": { "total": number },
  "vinculos": {
    "total": number,
    "porStatus": {
      "PREVISTO": { "quantidade": number, "percentual": number },
      "RECEBIDO": { "quantidade": number, "percentual": number },
      "APLICADO": { "quantidade": number, "percentual": number }
    }
  },
  "progressoTarefas": { "total": number, "concluidas": number, "percentual": number },
  "orcamento": { "totalOrcado": "0.00", "itensSemPreco": number }
}
```

### Resposta da Exportação CSV

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="lista-compras-{id}.csv"`
- Colunas: `Descricao, Unidade, Quantidade, Preco Unitario, Preco Total, Origem Preco`

---

## 3. Decisões Arquiteturais

**Agregações paralelas via Prisma.** O dashboard executa suas sete consultas (counts, `groupBy` de status, `aggregate` de orçamento) em `Promise.all`, reduzindo a latência da resposta. A distribuição de vínculos usa `groupBy(['status'])` filtrado pela cadeia `etapa.obraId`.

**Zero-fill da distribuição de status.** O `groupBy` do Prisma só retorna os status que existem. O service inicializa `PREVISTO/RECEBIDO/APLICADO` em zero e sobrescreve com os grupos encontrados — garantindo que o payload sempre exponha os três status, mesmo sem dados, para estabilidade do frontend.

**Decimal em todo valor monetário.** O total orçado vem de `itemCompra.aggregate({ _sum: { precoTotal } })` como `Prisma.Decimal`, serializado com `.toFixed(2)` (fallback `"0.00"`). O indicador `itensSemPreco` acompanha o total para sinalizar quão completo está o orçamento (itens ainda `PENDENTE`).

**Duas métricas de progresso.** Por decisão de produto, o foco primário do dashboard é o ciclo de vida dos materiais (`vinculos.porStatus`); o progresso físico de tarefas (`progressoTarefas`) é mantido como indicador complementar.

**Exportação CSV nativa, sem dependências.** O `export.service` gera a string CSV manualmente com escape conforme RFC 4180 (campos com vírgula, aspas ou quebra de linha são envolvidos em aspas duplas; aspas internas são duplicadas) e fim de linha CRLF. Service e controller **dedicados** mantêm a exportação como responsabilidade isolada; o controller define os headers HTTP de anexo. O PDF fica para o M7.

**Reuso do padrão em camadas.** Mantidos service → controller → rota, `Router({ mergeParams: true })` para o dashboard aninhado em `/api/obras/:obraId`, `authMiddleware` herdado e `AppError` + `errorMiddleware` central (404 ownership).

---

## 4. Cobertura de Testes Automatizados

Suíte de integração Jest + Supertest contra PostgreSQL isolado (schema `test_buildplan`), idempotente e executada no CI.

| Suíte | Foco | Casos principais |
|---|---|---|
| `dashboard.spec.ts` | Indicadores agregados | cenário controlado (2 PREVISTO / 1 RECEBIDO / 1 APLICADO, 2 tarefas com 1 concluída, lista precificada): contagens, distribuição com percentuais, **zero-fill** em obra vazia, total orçado, ownership 404, obra inexistente 404 |
| `export.spec.ts` | Exportação CSV | headers HTTP (`text/csv`, `Content-Disposition`), cabeçalho de colunas, total de linhas, **escape de campo com vírgula**, presença de `MANUAL`/`PENDENTE`, ownership 404 |

---

## 5. Nota Arquitetural — Entidade `Tarefa` (extensão deliberada ao RFC)

O modelo de dados do RFC (Seção 5.2) especifica as entidades `Usuario`, `Obra`, `Etapa`, `Material`, `Vinculo_Material_Etapa`, `Lista_Compras`, `Item_Compra` e `Log_Rastreabilidade`, **sem uma entidade de tarefas**. Durante a implementação (marco de execução M3), optou-se por introduzir a entidade `Tarefa` — vinculada a `Etapa` com `onDelete: Cascade`, com status `PENDENTE / EM_ANDAMENTO / CONCLUIDA / BLOQUEADA`, datas previstas/realizadas e ordenação — como **enhancement arquitetural deliberado**.

A motivação é dar granularidade executável às etapas da obra e alimentar o indicador de **progresso físico** exibido no Dashboard (Tela 2). A decisão é **puramente aditiva**: não altera nenhuma regra de negócio nem entidade prevista no RFC, e preserva a rastreabilidade material (RN01/RNF04) como núcleo do sistema. A extensão é coberta por testes de integração próprios (`tarefa.spec.ts`) e é compatível com os marcos subsequentes.

Essa nota fica registrada para fins de arguição do TCC, deixando explícito que a `Tarefa` é uma evolução consciente sobre o escopo original — e não uma divergência não planejada.

---

## 6. Rastreabilidade com o RFC e Próximos Passos

### Posição no cronograma do RFC

O M5 de execução fecha o entregável de **exportação** do RFC M5 ("lista de compras e estimativas — exportação PDF/CSV"), na parte CSV. Permanecem conscientemente adiados, com decisão homologada:

| Item do RFC | Situação | Destino |
|---|---|---|
| Exportação CSV da lista de compras | ✅ entregue (M5 Workstream B) | — |
| Exportação PDF | ⏳ adiada | M7 |
| Integração SINAPI (ETL de preços) | ⏳ pendente de produto | hook `resolverPrecoReferencia` pronto |
| Worker de alertas de prazo | ⏳ adiado | M6 |
| Deploy em produção / ajustes finais | ❌ pendente | M7 |

### Estado geral do backend

Com M1–M5 concluídos, o backend cobre: autenticação JWT, CRUD de obras/etapas/tarefas, catálogo de materiais, vínculos com máquina de estados RN01 e auditoria, listas de compras com snapshot, importação do memorial (UC01) e a camada analítica/exportação. Todos os endpoints estão protegidos, validados por Zod e cobertos por testes de integração reais.

### Preparação para o Frontend

O M5 conclui a superfície de API necessária para as telas do RFC (Seção 4): seleção de obras, Dashboard operacional (Tela 2, alimentada por `/dashboard`), catálogo e vínculos, lista de compras paramétrica (com exportação) e rastreabilidade. O próximo marco inicia o **frontend (React + Vite + TypeScript)** consumindo esta API. Recomenda-se, antes de começar: definir a estratégia de consumo da API (cliente HTTP + tratamento de token JWT), o fluxo de autenticação no SPA e o mapeamento tela→endpoint, aproveitando esta matriz e a do M4 como contrato.