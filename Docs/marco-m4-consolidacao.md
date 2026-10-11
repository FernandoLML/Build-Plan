# Marco M4 — Gestão de Insumos, Materiais e Listas de Compras
## Documento de Consolidação Técnica

**Projeto:** Build-Plan — Sistema Web de Gestão de Insumos e Etapas de Obra
**Backend:** Node.js + Express + TypeScript (ESM/NodeNext) · PostgreSQL + Prisma · Docker
**Branches do marco:** `feature-marco-m4` (Fases 1–2) · `feature-m4-memorial` (Fase 3)
**Status:** concluído — pronto para merge na `main`

---

## 1. Resumo Executivo das Fases Entregues

O Marco M4 implementou o núcleo de valor do produto: transformar o planejamento da obra em um catálogo de insumos rastreável e em um plano de aquisições. Foi entregue em três fases incrementais, cada uma com PR próprio e suíte de testes de integração aprovada.

### Fase 1 — Catálogo de Insumos e Vínculo com Etapas
CRUD completo de `Material` associado à `Obra` e o motor de vínculos `VinculoMaterialEtapa`, incluindo a máquina de estados da RN01 (`PREVISTO → RECEBIDO → APLICADO`) com registro atômico em `LogRastreabilidade` a cada transição (RNF04). Cobre os requisitos RF03 (catálogo) e RF04 (associação dinâmica) e o UC02 (vincular material à etapa).

### Fase 2 — Listas de Compras e Snapshots de Preços
Geração sob demanda de `ListaCompras` por etapa, a partir dos vínculos existentes, congelando um snapshot em `ItemCompra` (Seção 5.2). Fluxo "Informar" de preço manual com recálculo do total e cálculo de totais orçados em `Decimal`. Cobre o RF05 (relatório de compras) e o UC03 (gerar plano de aquisições).

### Fase 3 — Memorial Descritivo (UC01)
Extração assistida tabular (CSV/JSON) com pré-visualização para revisão e importação em lote, persistindo os materiais com `origem: MEMORIAL`. Parser com detecção de delimitador, cabeçalhos flexíveis e números em formato pt-BR. Cobre o RF02 (importação de documentos) e o UC01 (importar memorial), o grande diferencial do produto.

---

## 2. Matriz de Endpoints da API (M4)

Todas as rotas abaixo são protegidas pelo `authMiddleware` (JWT). Qualquer requisição sem token válido retorna **401**; qualquer corpo que falhe na validação Zod retorna **400** com a lista de `issues`. A regra de ownership é sempre "o recurso pertence (direta ou indiretamente) ao usuário autenticado; caso contrário, **404**" — nunca 403, para não revelar a existência de recursos de terceiros.

### Fase 1 — Catálogo de Materiais

| Método | Rota | Sucesso | Erros | Validação / Ownership |
|---|---|---|---|---|
| POST | `/api/obras/:obraId/materiais` | 201 | 400, 401, 404 | nome/unidade obrigatórios, quantidade ≥ 0 (RN03); obra do usuário |
| GET | `/api/obras/:obraId/materiais` | 200 | 401, 404 | obra do usuário |
| GET | `/api/materiais/:id` | 200 | 401, 404 | material → obra do usuário |
| PUT | `/api/materiais/:id` | 200 | 400, 401, 404 | ao menos um campo; material → obra do usuário |
| DELETE | `/api/materiais/:id` | 204 | 401, 404 | material → obra do usuário |

### Fase 1 — Vínculos Material-Etapa

| Método | Rota | Sucesso | Erros | Validação / Ownership |
|---|---|---|---|---|
| POST | `/api/etapas/:etapaId/materiais` | 201 | 400, 401, 404, 409 | quantidade > 0; material e etapa na **mesma obra** (400); ambos do usuário (404); par duplicado (409) |
| GET | `/api/etapas/:etapaId/materiais` | 200 | 401, 404 | etapa → obra do usuário; inclui o material |
| PATCH | `/api/vinculos/:id/status` | 200 | 400, 401, 404 | transição RN01 válida (400 se pular/regredir/igual); vínculo → etapa → obra do usuário |
| DELETE | `/api/vinculos/:id` | 204 | 401, 404 | vínculo → etapa → obra do usuário |

### Fase 2 — Listas de Compras e Itens

| Método | Rota | Sucesso | Erros | Validação / Ownership |
|---|---|---|---|---|
| POST | `/api/etapas/:etapaId/lista-compras` | 201 | 400, 401, 404 | etapa do usuário; 400 se não há vínculos para gerar |
| GET | `/api/obras/:obraId/listas-compras` | 200 | 401, 404 | obra do usuário; retorna totais |
| GET | `/api/listas-compras/:id` | 200 | 401, 404 | lista → obra do usuário; retorna totais |
| DELETE | `/api/listas-compras/:id` | 204 | 401, 404 | lista → obra do usuário (itens em cascata) |
| POST | `/api/listas-compras/:listaId/itens` | 201 | 400, 401, 404 | descrição/unidade/quantidade; lista → obra do usuário |
| PATCH | `/api/itens-compra/:id` | 200 | 400, 401, 404 | "Informar" preço; item → lista → obra do usuário |
| DELETE | `/api/itens-compra/:id` | 204 | 401, 404 | item → lista → obra do usuário |

### Fase 3 — Memorial Descritivo (UC01)

| Método | Rota | Sucesso | Erros | Validação / Ownership |
|---|---|---|---|---|
| POST | `/api/obras/:obraId/materiais/preview-memorial` | 200 | 400, 401, 404 | aceita `text/csv`, `{ csv }` ou `{ itens }`; 400 para CSV vazio ou sem cabeçalhos obrigatórios; obra do usuário |
| POST | `/api/obras/:obraId/materiais/importar-memorial` | 201 | 400, 401, 404 | lista revisada não vazia; obra do usuário; persiste com `origem: MEMORIAL` |

---

## 3. Decisões Arquiteturais Consolidadas

**Prisma.Decimal para valores numéricos sensíveis.** Quantidades (`Material`, `VinculoMaterialEtapa`, `ItemCompra`) e preços (`ItemCompra`) usam `Prisma.Decimal`, nunca `number` nativo, eliminando erro de ponto flutuante em valores monetários e de medição. Os totais orçados são somados com `.add()`/`.mul()` e serializados com `.toFixed(2)`.

**Transações atômicas com `prisma.$transaction`.** Três operações compostas são all-or-nothing: a transição de status do vínculo + o log de rastreabilidade; a geração da lista + seus itens; e a importação em lote do memorial. Em qualquer falha, nada é persistido.

**Máquina de estados RN01.** Um mapa de transições válidas (`PREVISTO → RECEBIDO → APLICADO`) impede pular etapas, regredir ou repetir status (400). As datas `dataRecebimento`/`dataAplicacao` são preenchidas automaticamente na transição e preservadas se já existirem.

**Registro imutável em `LogRastreabilidade` (RNF04).** Cada transição grava `statusAnterior`, `statusNovo` e o `usuarioId` executor, na mesma transação da atualização — garantindo auditabilidade sem risco de log órfão ou atualização sem log.

**Isolamento de preço com `resolverPrecoReferencia`.** A tabela SINAPI (populada por ETL — Seção 5.3) ainda não faz parte do schema. Em vez de poluir o `Material` com um preço fictício, o mecanismo de snapshot chama um hook `resolverPrecoReferencia()` que hoje retorna `null` (itens nascem `PENDENTE`) e, quando a tabela SINAPI existir, passará a resolver por `codigoSinapi` sem alterar o restante do fluxo. O preço entra, por ora, pelo fluxo manual "Informar".

**`express.text` para parsing de CSV.** Para aceitar o Memorial Descritivo colado como texto cru (`text/csv`/`text/plain`) além do payload JSON, o middleware `express.text` foi adicionado ao lado do `express.json`. O parser suporta delimitadores `,`/`;`/tab, cabeçalhos flexíveis por sinônimos e números pt-BR (`1.000,25` → `1000.25`).

**Arquitetura em camadas e rotas aninhadas.** Mantido o padrão service → controller → rota, com `Router({ mergeParams: true })` para recursos aninhados e `authMiddleware` herdado dos routers pai. Erros fluem por `AppError` + `errorMiddleware` central (404 ownership, 400 regra de negócio, 409 conflito), sem vazar detalhes internos.

---

## 4. Cobertura de Testes Automatizados

Suíte de integração com Jest + Supertest contra um PostgreSQL isolado (schema `test_buildplan`), idempotente (`resetDatabase()` via `TRUNCATE ... CASCADE` antes de cada teste) e executada no CI (GitHub Actions, gatilho `feature-**`).

| Suíte | Foco | Casos principais |
|---|---|---|
| `material.spec.ts` | CRUD + ownership + Zod | criação (201), listagem escopada, GET/PUT/DELETE, 404 de ownership (B não acessa material de A), quantidade negativa e campos obrigatórios (400) |
| `vinculo.spec.ts` | Vínculo + RN01 + auditoria | criação (201), mesma obra (400), material alheio (404), duplicidade (409), transição completa PREVISTO→RECEBIDO→APLICADO com datas, transições inválidas (400), e verificação direta do `LogRastreabilidade` (2 logs com status/usuário corretos) + atomicidade (transição inválida não grava log) |
| `lista-compras.spec.ts` | Geração/snapshot + totais | geração com snapshot, sem vínculos (400), etapa alheia (404), totais (`totalItens`/`itensSemPreco`/`totalOrcado`), "Informar" preço e recálculo, ownership (404), remoção em cascata confirmada no banco |
| `memorial.spec.ts` | UC01 preview + import | CSV vírgula/ponto-e-vírgula pt-BR, JSON `{csv}`/`{itens}`, linhas rejeitadas com motivo, CSV vazio/cabeçalho inválido (400), ownership (404); import com verificação no banco (`origem: MEMORIAL`, decimais), atomicidade (carga inválida → 0 persistido), lista vazia (400) |

Observação de verificação: além dos testes de integração, o parser de CSV (`parseMemorialCSV`/`validarItensJson`) foi exercitado isoladamente em runtime, confirmando a detecção de delimitador, a conversão pt-BR e a separação válidos/rejeitados.

---

## 5. Rastreabilidade com o RFC e Próximos Passos

### Cobertura do RFC no M4

| Item do RFC | Entregue no M4 |
|---|---|
| RF02 — Importação de documentos | Fase 3 (UC01 memorial) |
| RF03 — Catálogo de insumos | Fase 1 (CRUD de Material) |
| RF04 — Associação dinâmica | Fase 1 (VinculoMaterialEtapa) |
| RF05 — Relatório de compras | Fase 2 (ListaCompras/ItemCompra) |
| RN01 — Aplicado só se Recebido | Fase 1 (máquina de estados) |
| RN03 — Quantidade não negativa | Validação Zod em Material/Itens |
| RNF04 — Auditabilidade | LogRastreabilidade transacional |
| UC01 / UC02 / UC03 | Fases 3 / 1 / 2 |

### Itens conscientemente adiados (fora do escopo do M4)

- **Tabela de preços SINAPI + ETL Node-cron (Seção 5.3):** o hook `resolverPrecoReferencia` está pronto para recebê-la; até lá, preços são informados manualmente.
- **Worker de alertas de prazo (Seção 5.3 / C4 / FA03):** alocado no **Marco M6** pelo cronograma oficial do RFC (semanas 11–12). Decisão homologada de não antecipar para preservar a estabilidade da arquitetura e o prazo. Antes de implementá-lo, três definições pendentes: onde mora a "janela de alerta" (constante vs. configurável), se os alertas são persistidos (entidade `Alerta` vs. cálculo on-the-fly) e a estratégia de idempotência do envio por SMTP.

### Fechamento e preparação para o M5

O M4 está pronto para o merge na `main` com as três fases entregues, testadas e documentadas. Recomenda-se, no merge: publicar esta consolidação na Wiki do GitHub (requisito de documentação do RFC), garantir o CI verde na `main` após o merge, e abrir a branch do próximo marco a partir da `main` já atualizada. O M5 deve ser definido com base na sequência do RFC — tipicamente o amadurecimento do dashboard operacional (Tela 2) e das telas de catálogo/compras/rastreabilidade que consomem os endpoints consolidados aqui.
