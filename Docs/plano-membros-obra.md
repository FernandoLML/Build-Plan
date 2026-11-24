# Plano: mais de um usuário por obra

> Status: **planejado, não implementado** (decidido em 22/11/2026, para depois da prova de autoria).
> Fecha a lacuna "papéis gestor e proprietário sem autorização" registrada em [aderencia-rfc.md](aderencia-rfc.md).

## Objetivo

Hoje cada obra tem um único dono (`Obra.usuarioId`), e todo service filtra os dados por esse dono. A proposta permite que o dono adicione outros usuários à obra, cada um com um papel:

| Papel na obra | Quem é | Pode |
|---|---|---|
| **Dono** | Quem criou a obra (`Obra.usuarioId`) | Tudo, inclusive gerenciar membros e excluir a obra |
| **Gestor** | Engenheiro, mestre de obras, comprador | Ler e alterar etapas, materiais, vínculos, status, tarefas e listas; editar os dados da obra |
| **Proprietário** | Cliente dono do imóvel | Só visualizar e exportar (dashboard, materiais, rastreabilidade, listas, Excel/PDF) |

## Decisões tomadas

1. **Entrada por e-mail de conta existente.** O dono informa o e-mail de alguém já cadastrado, e a pessoa vê a obra na hora. Não há convite por link, porque isso dependeria do SMTP, que ainda não está configurado em produção. O convite por e-mail fica como evolução.
2. **Papel por obra, não por usuário.** A mesma pessoa pode ser gestora numa obra e proprietária em outra. O campo global `Usuario.papel` perde a função e pode ser removido depois.
3. **O dono continua em `Obra.usuarioId`.** Nenhum dado existente precisa ser migrado: toda obra atual continua com o mesmo dono e sem membros.
4. **404 para quem não é membro, 403 para membro sem permissão.** Quem não participa da obra não descobre que ela existe (regra atual). Um proprietário que tenta alterar algo já sabe que a obra existe, então recebe 403, uma mensagem mais clara.

## Banco de dados

```prisma
model ObraMembro {
  id        String       @id @default(uuid())
  obraId    String       @map("obra_id")
  usuarioId String       @map("usuario_id")
  papel     PapelUsuario // GESTOR | PROPRIETARIO (reaproveita o enum existente)
  createdAt DateTime     @default(now()) @map("created_at")

  obra    Obra    @relation(fields: [obraId], references: [id], onDelete: Cascade)
  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@unique([obraId, usuarioId]) // não adiciona a mesma pessoa duas vezes
  @@index([usuarioId])          // "obras em que sou membro"
  @@map("obra_membro")
}
```

`Obra` ganha `membros ObraMembro[]` e `Usuario` ganha `participacoes ObraMembro[]`. A migração só cria a tabela, sem alterar dados.

**Log de rastreabilidade e exclusão de conta.** Hoje `conta.service.ts` apaga os logs do usuário quando ele exclui a conta. Numa obra compartilhada, isso apagaria o histórico que os outros membros veem. Mudança:

- `LogRastreabilidade.usuarioId` passa a ser opcional, com `onDelete: SetNull`.
- Na exclusão da conta, os logs das obras **dos outros** ficam, sem o autor (a tela mostra "usuário removido"). Os logs das obras do próprio usuário somem junto com as obras, em cascata.
- Isso continua atendendo a LGPD: o dado pessoal (o vínculo com a pessoa) é removido e o fato ("material recebido em tal data") permanece.

## Backend

### Ponto central de autorização

Um arquivo novo, `backend/src/services/acesso-obra.ts`, substitui os filtros `obra: { usuarioId }` espalhados hoje por 11 services (cerca de 40 consultas):

```ts
type Nivel = "LEITURA" | "EDICAO" | "DONO";

// Filtro Prisma: obras que o usuário pode ver (dono ou membro).
export const obraVisivel = (usuarioId: string) => ({
  OR: [{ usuarioId }, { membros: { some: { usuarioId } } }],
});

// Resolve o papel do usuário na obra; null = não participa.
export async function papelNaObra(obraId: string, usuarioId: string): Promise<"DONO" | PapelUsuario | null>;

// 404 se não participa; 403 se o papel não alcança o nível pedido.
export async function exigirAcesso(obraId: string, usuarioId: string, nivel: Nivel): Promise<void>;
```

**Como cada service muda:**

- **Leituras** trocam `obra: { usuarioId }` por `obra: obraVisivel(usuarioId)`. A mudança é mecânica e continua com uma consulta só.
- **Escritas** buscam o recurso com `obraVisivel` (404 se não achar) e chamam `exigirAcesso(obraId, usuarioId, "EDICAO")` (403 para o proprietário).
- **Gerenciar membros e excluir a obra** usam `exigirAcesso(…, "DONO")`.

### Matriz de permissões por rota

| Rotas | Proprietário | Gestor | Dono |
|---|:-:|:-:|:-:|
| `GET` obras, etapas, materiais, vínculos, logs, tarefas, listas, dashboard | ✔ | ✔ | ✔ |
| `GET /listas-compras/:id/export.(csv\|xlsx\|pdf)` | ✔ | ✔ | ✔ |
| `POST/PUT/DELETE` etapas, materiais, tarefas | 403 | ✔ | ✔ |
| `POST` memorial (prévia e importação) | 403 | ✔ | ✔ |
| `POST/DELETE` vínculos, `PATCH /vinculos/:id/status` | 403 | ✔ | ✔ |
| `POST` lista de compras, `POST/PATCH/DELETE` itens, `DELETE` lista | 403 | ✔ | ✔ |
| `PUT /obras/:id` (dados da obra) | 403 | ✔ | ✔ |
| `DELETE /obras/:id` | 403 | 403 | ✔ |
| `GET /obras/:id/membros` | ✔ | ✔ | ✔ |
| `POST/PATCH/DELETE /obras/:id/membros` | 403 | 403 | ✔ |
| Usuário sem participação, em qualquer rota da obra | 404 | | |

### Rotas novas

Ficam em `routes/membro.routes.ts`, `controllers/membro.controller.ts`, `services/membro.service.ts` e `schemas/membro.schema.ts`, montadas em `obra.routes.ts` como as outras sub-rotas:

| Método e rota | Corpo | Regras |
|---|---|---|
| `GET /api/obras/:obraId/membros` | — | Lista o dono e os membros (nome, e-mail, papel) |
| `POST /api/obras/:obraId/membros` | `{ email, papel }` | Só o dono. E-mail sem conta → 404 "Nenhum usuário com este e-mail". O próprio dono → 400. Pessoa já na obra → 409 (`P2002`) |
| `PATCH /api/obras/:obraId/membros/:usuarioId` | `{ papel }` | Só o dono |
| `DELETE /api/obras/:obraId/membros/:usuarioId` | — | O dono remove qualquer membro; o membro pode remover a si mesmo (sair da obra) |

`GET /api/obras` passa a devolver as obras próprias e as compartilhadas, com um campo `meuPapel` (`DONO`, `GESTOR` ou `PROPRIETARIO`) para o frontend saber o que mostrar.

**Privacidade:** a resposta de "e-mail sem conta" revela se o e-mail está cadastrado. O risco é aceitável porque só o dono de uma obra pode chamar a rota e ela fica sob o rate limit geral. A alternativa (convite por link) elimina esse ponto e fica como evolução.

## Frontend

| Onde | Mudança |
|---|---|
| `types/obra.ts`, `api/obras.ts` | Campo `meuPapel`; funções `listarMembros`, `adicionarMembro`, `alterarPapel`, `removerMembro` |
| `hooks/useMembros.ts` (novo) | `useQuery` da lista; mutações que invalidam `["membros", obraId]` e `["obras"]` |
| `contexts/ObraContext.tsx` | Expõe o papel na obra ativa; hook `usePermissaoObra()` → `{ podeEditar, ehDono }` |
| `components/obras/MembrosDialog.tsx` (novo) | Lista de membros, formulário e-mail + papel (react-hook-form + Zod), remover, sair da obra |
| `components/obras/ObraCard.tsx` | Selo "Compartilhada · Gestor/Proprietário"; menu "Membros"; excluir só para o dono |
| Páginas de materiais, etapas, cronograma, rastreabilidade e compras | Botões de criar, editar, excluir, vincular e mudar status escondidos quando `!podeEditar`. Exportar continua visível |
| Rastreabilidade | Já mostra o nome de quem mudou o status. Com vários usuários, o log passa a ter valor real; exibe "usuário removido" quando o autor for nulo |

Esconder botões é só para a experiência. Quem garante a regra é o backend (403), como já acontece com o saldo do material.

## Testes

**Backend (Jest + Supertest, Postgres de teste):**
- `membro.spec.ts`: adicionar, listar, alterar papel, remover, sair; e-mail inexistente (404), duplicado (409), o próprio dono (400), não-dono gerenciando (403).
- `acesso-obra.spec.ts`: para cada papel, uma leitura (200) e uma escrita por recurso (gestor 2xx, proprietário 403); quem não participa recebe 404 em tudo.
- Ajustes: `obra.spec.ts` (listar inclui as compartilhadas com `meuPapel`), `conta.spec.ts` (log de obra alheia fica com autor nulo).
- Os testes atuais de posse continuam passando sem mudança: o dono segue com acesso total e os estranhos seguem com 404.

**Frontend (Vitest):** `MembrosDialog.test.tsx`, `usePermissaoObra` e um teste de página confirmando que o proprietário não vê os botões de edição.

## Ordem de implementação

1. Migração `ObraMembro` + log com autor opcional.
2. `acesso-obra.ts` com testes unitários.
3. Trocar os filtros nos 11 services (leituras) e adicionar `exigirAcesso` nas escritas.
4. Rotas de membros + `meuPapel` na listagem de obras.
5. Exclusão de conta preservando logs de obras alheias.
6. Frontend: tipos, API, hook, `MembrosDialog`, `usePermissaoObra`, botões condicionais.
7. Docs: raio-x (modelo, rotas, matriz), aderência ao RFC (papéis passa de Parcial para Atendido), README.

Estimativa: dois a três dias de trabalho, num PR próprio, mantendo a cobertura e o Quality Gate.

## Riscos

| Risco | Mitigação |
|---|---|
| Esquecer um filtro e vazar dado de outra obra | Todos os filtros passam por `acesso-obra.ts`; teste de "não participa → 404" para cada recurso |
| Consulta extra em cada escrita | Uma busca por índice único `(obraId, usuarioId)`; custo desprezível no volume do sistema |
| Escopo do RFC (§2.6 exclui "hierarquia complexa de permissões") | São dois papéis fixos e uma matriz simples, não uma hierarquia configurável |

## Como explicar hoje, antes de implementar

> "O sistema é de um usuário por obra: o dono está em `Obra.usuarioId` e todo service filtra por ele. O campo `papel` existe, mas ainda não autoriza nada. O próximo passo está planejado: uma tabela `ObraMembro` com o papel por obra, um ponto único de autorização que troca o filtro do dono por 'dono ou membro', 403 para o proprietário que tenta alterar algo e 404 para quem não participa. Como o dono continua no mesmo campo, a mudança não exige migrar dados."
