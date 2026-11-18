# Build-Plan — Aderência ao RFC

> Última revisão em 2026-11-17, sobre a branch `fix-correcoes-pos-revisao`.
> Compara o que o [RFC](RFC.md) prometeu com o que está no código: onde cada requisito foi implementado, o que mudou durante o desenvolvimento e por quê, e o que ficou de fora.
> Para a descrição técnica completa, ver o [raio-x arquitetural](arquitetura-raio-x.md).

## Resumo

| Grupo | Atendido | Parcial | Não implementado |
|---|:-:|:-:|:-:|
| Casos de uso (UC01–UC04) | 4 | — | — |
| Requisitos funcionais (RF01–RF06) | 6 | — | — |
| Requisitos não funcionais (RNF01–RNF04) | 4 | — | — |
| Regras de negócio (RN01–RN03) | 3 | — | — |
| Segurança (§6.1) | 8 | 1 | — |
| Privacidade e LGPD (§6.2) | 4 | 1 | — |
| Arquitetura e stack (§5) | 9 | 2 | 1 |

O único item não implementado é o **worker de alertas de prazo** (§5.1 e marco M6). Os itens parciais e as mudanças de desenho estão explicados em [Desvios do RFC](#desvios-do-rfc).

## Casos de uso

| Caso de uso | Onde está | Teste |
|---|---|---|
| **UC01** Importar Memorial Descritivo | `backend/src/services/memorial.service.ts` (parser e importação) · `frontend/src/pages/memorial/MemorialPage.tsx` | `memorial.spec.ts` · `MemorialPage.test.tsx` |
| **UC02** Vincular material à etapa | `vinculo-material.service.ts` → `criar` · `VincularEtapaDialog.tsx` | `vinculo.spec.ts` |
| **UC03** Gerar plano de aquisições | `lista-compras.service.ts` → `gerarPorEtapa` · `ComprasPage.tsx` | `lista-compras.spec.ts` · `ComprasPage.test.tsx` |
| **UC04** Atualizar rastreabilidade | `vinculo-material.service.ts` → `atualizarStatus` · `RastreabilidadePage.tsx` | `vinculo.spec.ts` · `log.spec.ts` |

## Requisitos funcionais

| Requisito | Como foi atendido |
|---|---|
| **RF01** Cadastro de obra e ambientes | CRUD de obras e etapas (`obra.service.ts`, `etapa.service.ts`), com isolamento por usuário. |
| **RF02** Importação de documentos | Memorial em CSV com pré-visualização: o usuário revisa as linhas aceitas e rejeitadas antes de gravar. |
| **RF03** Catálogo de insumos | `material.service.ts`: nome, especificação, unidade, quantidade, origem (`MEMORIAL` ou `MANUAL`) e código SINAPI. |
| **RF04** Associação dinâmica | `VinculoMaterialEtapa`: o mesmo material em várias etapas, cada vínculo com quantidade, local e status próprios. |
| **RF05** Relatório de compras | Lista por etapa com preço de referência do SINAPI e exportação em CSV, Excel e PDF (`export.service.ts`); Excel e PDF também em versão preto e branco, para impressão. |
| **RF06** Monitoramento de status | `StatusVinculo` (`PREVISTO → RECEBIDO → APLICADO`) com datas de recebimento e aplicação. |

Entregue além do RFC: cronograma de tarefas com progresso físico por etapa e dashboard de indicadores da obra.

## Requisitos não funcionais

| Requisito | Como foi atendido |
|---|---|
| **RNF01** Usabilidade | Interface única (React, shadcn/ui), navegação lateral fixa, estados de carregamento, vazio e erro em todas as telas. |
| **RNF02** Confiabilidade | Validação com Zod em toda entrada da API; índices únicos contra duplicidade (e-mail, vínculo material-etapa), com resposta 409; o total vinculado de um material às etapas nunca passa da quantidade dele no catálogo (`material-saldo.ts`, com trava de linha contra vínculos simultâneos). |
| **RNF03** Recuperação de informação | Busca no catálogo de materiais por nome, código e especificação; busca no SINAPI com índice GIN (`pg_trgm`). |
| **RNF04** Auditabilidade | `LogRastreabilidade`: cada mudança de status grava usuário, status anterior, novo status e data, na mesma transação. |

## Regras de negócio

| Regra | Onde está | Teste |
|---|---|---|
| **RN01** Só é *Aplicado* o que já foi *Recebido* | `TRANSICOES_VALIDAS` em `vinculo-material.service.ts`: avança um passo por vez, sem pular nem voltar. | `vinculo.spec.ts` |
| **RN02** Alertar ao excluir etapa com materiais vinculados | A listagem de etapas devolve `totalMateriaisVinculados`; o `ExcluirEtapaDialog.tsx` mostra quantos materiais ficarão sem associação antes de confirmar. | `etapa.spec.ts` (contagem) · `ExcluirEtapaDialog.test.tsx` |
| **RN03** Quantidades não negativas | Schemas Zod: `nonnegative` em material e `positive` em vínculo, item de compra e memorial. | `material.spec.ts` · `vinculo.spec.ts` |

## Segurança (§6.1)

| Item do RFC | Situação |
|---|---|
| Senha com bcrypt, custo 12 | Atendido (`auth.service.ts`, `BCRYPT_COST`). |
| JWT com expiração | Atendido: HS256, 8 h, apenas o claim `sub`. |
| Isolamento de dados por usuário | Atendido: toda consulta filtra pela cadeia até `obra.usuarioId`; recurso alheio responde 404. |
| Validação de entrada | Atendido: Zod em corpo, parâmetros e query. |
| Mensagens de erro sem detalhes internos | Atendido: `error.middleware.ts`; login com mensagem única. |
| HTTPS | Atendido: Nginx com certificado Let's Encrypt e HSTS. |
| Proteção contra força bruta | Atendido: rate limit por IP em login, cadastro e recuperação de senha. |
| Cabeçalhos de segurança e CORS restrito | Atendido: `helmet` e allowlist `CORS_ORIGINS`. |
| Armazenamento do token no navegador | **Parcial**: fica em `localStorage`, exposto a XSS. A alternativa (cookie `httpOnly` com refresh token) está registrada como evolução em `frontend/src/lib/token.ts`. |

## Privacidade e LGPD (§6.2)

| Direito ou compromisso | Situação |
|---|---|
| Consentimento no cadastro | Atendido: aceite obrigatório da Política de Privacidade, validado no frontend e na API, com a data gravada em `usuario.consentimento_em`. |
| Acesso aos dados | Atendido: todos os dados do usuário aparecem nas telas do sistema; a política está em `/privacidade`. |
| Correção dos dados | Atendido: *Minha conta* (`PUT /api/auth/me`). |
| Exclusão da conta e dos dados | Atendido: *Minha conta* (`DELETE /api/auth/me`, com confirmação por senha) apaga obras, etapas, materiais, vínculos, logs e listas. |
| Cancelamento de alertas por e-mail | **Parcial**: não se aplica hoje, pois o sistema não envia alertas. O único e-mail enviado é o de redefinição de senha, a pedido do usuário. |

## Desvios do RFC

Mudanças de desenho tomadas durante o desenvolvimento, com o motivo.

| O RFC previa | O que foi feito | Por quê |
|---|---|---|
| Camada de **Repositories** entre services e banco (C4 nível 3) | Os services usam o Prisma Client diretamente. | O Prisma já é a abstração de acesso a dados: tipado, sem SQL espalhado. Uma camada a mais só repassaria chamadas. O custo é o acoplamento dos services ao Prisma; os testes compensam rodando contra PostgreSQL real, sem mocks. |
| **ETL do SINAPI** por `node-cron` dentro da API, lendo CSV | Script `sinapi:import` (lê a planilha `.xlsx` oficial da Caixa), executado sob demanda pelo serviço `sinapi` do Docker Compose. | A Caixa publica em `.xlsx`, não em CSV. Rodar fora do processo da API evita que uma importação de milhares de linhas concorra com as requisições. O princípio do RFC foi mantido: a lista de compras consulta só o banco local. |
| Atualização mensal automática do SINAPI | **Parcial**: o workflow agendado existe (`sinapi-import.yml`), mas não alcança o banco de produção, que não tem porta pública. A carga em produção é manual. | Abrir o banco para a internet seria pior que a carga manual. O caminho é disparar a importação pela mesma via do deploy (AWS SSM). |
| **Worker de alertas de prazo** com e-mail (SMTP) | **Não implementado.** | Priorizou-se o núcleo do RFC (UC01–UC04), a precificação pelo SINAPI e a operação em produção. O envio de e-mail já existe (redefinição de senha), o que reduz o trabalho restante a datas nas etapas, um agendador e o texto do alerta. |
| Papéis **gestor** e **proprietário** com visões diferentes | **Parcial**: o campo `papel` existe, mas não há autorização por papel. Cada usuário vê apenas as próprias obras. | Hierarquia de permissões está fora do escopo declarado (§2.6). Compartilhar uma obra com o proprietário exigiria um modelo de convite. |
| Documentação na **Wiki** do GitHub | Documentação versionada na pasta `Docs/` do repositório. | Fica junto do código, entra em revisão nos PRs e tem histórico no Git. |
| Deploy automatizado "a cada push na branch principal" | Atendido para a API (GitHub Actions: imagens no GHCR e atualização da EC2 por AWS SSM) e para o frontend (Vercel). | — |
| Deploy em AWS EC2, Heroku ou Cloud Run | API e banco em AWS EC2; frontend estático na Vercel. | O frontend é só arquivos estáticos; a infraestrutura com lógica e dados (API, banco, proxy, observabilidade) está na EC2. |
| TDD em todos os marcos | Testes automatizados em todas as funcionalidades, com cobertura acima das metas (75% backend, 25% frontend). | Ver a cobertura atual no SonarCloud. |

## Fora do escopo (RFC §2.6), mantido fora

Módulo financeiro, integração com BIM, aplicativo nativo, leitura automática de PDF e hierarquia complexa de permissões.

## Pendências conhecidas

A lista completa, com severidade, está na seção 7 do [raio-x](arquitetura-raio-x.md). As que tocam requisitos do RFC:

1. Worker de alertas de prazo (marco M6).
2. Atualização mensal do SINAPI em produção sem intervenção manual.
3. Token de sessão em cookie `httpOnly`, com revogação ao trocar a senha.
