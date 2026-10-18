# Registro de Decisões de Arquitetura e Contratos (Frontend vs. RFC)

### 1. Entidade Obra e Status de UI (Tela 1)
- **RFC / Planejado:** Esperava-se status operacional da obra (Em Andamento, Concluída, etc.) e datas de início/fim persistidas.
- **Implementado (Real):** O model `Obra` no backend possui apenas `nome`, `descricao`, `endereco`, `createdAt` e `updatedAt`.
- **Decisão:** O badge "Ativa" reflete o estado de UI da obra atualmente selecionada no `ObraContext` (persistido via `localStorage`), e a data exibida é `createdAt`. Sanitização com `toObraPayload` para enviar `undefined` em campos vazios.

### 2. Contrato do Dashboard e Ausência de Custo Realizado (Tela 2)
- **RFC / Planejado:** Gráficos e comparativos de "Custo Orçado vs. Custo Realizado" com cálculo de "Desvio".
- **Implementado (Real):** O endpoint `GET /api/obras/:obraId/dashboard` fornece apenas `orcamento.totalOrcado`, `itensSemPreco`, `porStatus` (quantidades/percentuais) e `progressoTarefas`.
- **Decisão:** O frontend reflete estritamente o contrato real. A visualização de "Orçado vs Realizado" depende de evolução futura no backend (ex.: persistência do custo efetivamente pago por aquisição).

### 3. Parsing do Memorial Descritivo (Tela 3)
- **RFC / Planejado:** Upload de arquivos PDF com extração baseada em processamento de texto/IA e detecção automática de etapas.
- **Implementado (Real):** O backend consome texto estruturado CSV (`POST /preview-memorial` e `/importar-memorial`). Os itens extraídos geram `Material` no catálogo sem amarração direta com etapas.
- **Decisão:** Leitura de arquivos `.csv`/`.txt` executada via `FileReader` no client-side para manter a experiência de drag-and-drop, mapeando as colunas reais (`nome`, `especificacao`, `unidade`, `quantidade`, `codigoSinapi`).

### 4. Precificação e Agrupamento de Vínculos (Telas 4 e 5)
- **RFC / Planejado:** Precificação unitária direto no Catálogo de Materiais e listagem única de itens de compra da obra.
- **Implementado (Real):** O model `Material` é exclusivamente descritivo de catálogo. O campo `precoUnitario` e o subtotal calculado pertencem ao `ItemCompra`. Além disso, listas de compra pertencem a uma `Etapa`.
- **Decisão:** Na Tela 4 (Catálogo), gerencia-se apenas o cadastro e a vinculação às etapas. A precificação ocorre na Tela 5 (Lista de Compras por Etapa), invalidando a query do Dashboard após salvar o preço.

### 5. Exportação de Arquivos CSV Autenticada (Tela 5)
- **Implementado:** Em vez de disparar `window.open` (que perde o token JWT de autorização), a requisição é feita via Axios com header `Authorization: Bearer` e o arquivo é baixado via Blob (`lib/download.ts`).