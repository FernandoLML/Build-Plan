# Consolidação Técnica do Frontend — RFC vs. Implementado

**Projeto:** Build-Plan — SPA (React + Vite + TypeScript)
**Escopo:** 6 telas do RFC (Seção 4) + autenticação, layout e navegação
**Objetivo deste documento:** registrar, para fins de arguição do TCC, as adaptações
práticas feitas no frontend em relação ao que o RFC descreve, sempre alinhando a
interface ao **contrato real** da API em vez de supor campos/fluxos inexistentes.

---

## 1. Princípio adotado

A UI foi construída sobre os endpoints e modelos **efetivamente homologados** no
backend. Onde o RFC (ou o enunciado de uma tela) sugeria um dado ou fluxo que não
existe no modelo atual, optou-se por **não inventar** o dado: adaptamos a tela ao
que a API entrega e registramos a lacuna como evolução futura. É a mesma postura
usada no backend (ex.: `resolverPrecoReferencia` e a entidade `Tarefa`).

---

## 2. Adaptações por tela

### Tela 2 — Dashboard: ausência de "custo realizado" / desvio
O endpoint `GET /api/obras/:obraId/dashboard` retorna **orçado** (`totais.totalOrcado`),
distribuição de vínculos por status, progresso de tarefas e `itensSemPreco` — **não há
custo realizado** nem **desvio (orçado × real)**. O `Material` e o `ItemCompra` não
guardam valor efetivamente pago.

- **Implementado:** KPIs de Total Orçado, Materiais, Vínculos e Itens sem preço; barras
  de progresso de recebimento/aplicação e tarefas; "pontos de atenção" derivados
  (itens sem preço + vínculos ainda previstos).
- **Lacuna/evolução:** "Orçado vs. Realizado" exige registrar o custo real de compra
  (campo em `ItemCompra` ou evento de compra) e expor `realizado`/`desvio` no endpoint.

### Tela 3 — Memorial: CSV tabular em vez de PDF/NLP
O RFC idealiza "extração assistida" de um memorial descritivo. O backend homologado
(UC01) é **tabular**: aceita **CSV como texto** (`{ csv }` ou `text/csv`), não
`multipart`, não PDF e não extração por NLP. Os itens extraídos têm
`{ nome, especificacao?, unidade, quantidade, codigoSinapi? }` — **sem "categoria/etapa
detectada"**.

- **Implementado:** upload/colagem de `.csv`/`.txt` lido no cliente → `preview-memorial`
  (itens válidos + linhas rejeitadas com motivo) → `importar-memorial` (cria materiais
  com `origem: MEMORIAL`).
- **Lacuna/evolução:** parsing de PDF e extração por IA/NLP; detecção automática de etapa.

### Tela 4 — Catálogo: "preço unitário" não é atributo do Material
A edição rápida de **preço unitário com subtotal** não se aplica ao catálogo: o
`Material` **não tem `precoUnitario`** no backend. Preço vive no `ItemCompra`
(lista de compras, Tela 5).

- **Implementado:** catálogo com Nome, Especificação, Unidade, Quantidade, Origem e
  ações (Vincular/Editar/Excluir); edição rápida de **quantidade**. Vínculos são
  geridos **por etapa** (não "por material"), pois o endpoint de vínculos é
  `GET /api/etapas/:etapaId/materiais`.
- **Lacuna/evolução:** preço no catálogo só faria sentido com um campo de referência
  no `Material` ou com a tabela SINAPI.

### Tela 5 — Itens de Compra vs. Catálogo
Não existe endpoint de "itens de compra da obra" avulsos: itens pertencem a uma
`ListaCompras`, **gerada por etapa** (snapshot). "Status" não existe em item de
compra — o que há é `origemPreco` (SINAPI/MANUAL/PENDENTE).

- **Implementado:** listas por etapa (`GET /api/obras/:obraId/listas-compras`), cada uma
  com seus itens e totais; geração por etapa; "Informar preço" (`PATCH /itens-compra/:id`)
  com subtotal; filtro "somente itens sem preço"; exportação **CSV** (busca autenticada +
  download via Blob).
- **Lacuna/evolução:** exportação **PDF** (adiada para o M7); preços automáticos (SINAPI).

### Tela 6 — Rastreabilidade: endpoint de leitura de log criado sob demanda
O log de auditoria era **gravado** mas **não exposto**. Foi necessário um incremento de
backend durante o M5 (`GET /api/vinculos/:id/logs` e `GET /api/obras/:obraId/logs`) para
viabilizar a timeline.

- **Implementado:** transição RN01 guiada na UI (só oferece o próximo estado válido) via
  `PATCH /api/vinculos/:id/status` com observação; timeline por vínculo em modal.
- **Observação:** a timeline usa `Dialog` (o componente `sheet` do shadcn não foi
  instalado); trocar por `Sheet` lateral é cosmético.

---

## 3. Divergências estruturais já documentadas no backend

- **Entidade `Tarefa`**: extensão deliberada além do modelo do RFC (Seção 5.2), usada no
  indicador de progresso físico do Dashboard. Registrada na consolidação do M5.
- **`resolverPrecoReferencia` (SINAPI)**: hook pronto que hoje retorna `null`; preços
  entram manualmente pelo fluxo "Informar". Registrado na consolidação do M4.

---

## 4. Decisões de frontend que valem registro

- **JWT em `localStorage`** (UX sobre a alternativa só-memória), com trade-off de XSS
  documentado; evolução recomendada: cookie httpOnly + refresh token (exige mudança no
  backend).
- **Stack além do RFC**: Tailwind, shadcn/ui, TanStack Query, Axios, React Router e
  React Hook Form + Zod não são citados no RFC (que só fixa React + Vite + TS). São
  adições deliberadas, sem conflito com as restrições do projeto (nada de Next.js,
  Vercel, Supabase ou SQLite).
- **Decimais como string**: a API serializa `Decimal` como string; o frontend nunca soma
  dinheiro em `float` — exibe com `Intl.NumberFormat` (pt-BR) e usa os totais já
  calculados pelo backend.

---

## 5. Itens pendentes (mapa para o M7 e além)

| Item | Status | Destino |
|---|---|---|
| Deploy em produção + CORS restrito | pendente | M7 |
| Exportação PDF da lista de compras | adiado | M7 |
| Custo realizado / desvio no Dashboard | não modelado | incremento de backend |
| Integração SINAPI (ETL de preços) | não modelado | fase dedicada |
| Worker de alertas de prazo | adiado | M6 do RFC |
| Testes automatizados de frontend (Vitest/RTL) | não iniciado | recomendado antes do deploy |

A última linha é um **ponto que vale integrar**: o backend tem cobertura de testes de
integração, mas o frontend ainda não tem testes automatizados. Antes do deploy do M7,
recomenda-se uma suíte mínima com Vitest + React Testing Library (fluxo de login,
guarda de rota, e um fluxo de obra/vínculo) para proteger contra regressões.
