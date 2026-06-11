# RFC: Request for Comments — Projeto de Portfólio  
**Engenharia de Software – Católica SC**

---

## Identificação

- **Título do Projeto:** Buil-Plan – Sistema Web de Gestão de Insumos e Etapas de Obra  
- **Linha de Projeto (Direction):** Web  
- **Autor:** Fernando Lucas Moraes da Luz 
- **Data da Proposta:** 12/04/2026  
- **Versão:** 1.0  

---

## 1. Visão do Produto e Impacto (O Problema)

### 1.1 Contexto e Problema

O setor da construção civil, especialmente em obras de pequeno e médio porte, sofre com a falta de planejamento estruturado e fluxos de informação fragmentados entre o escritório e o canteiro de obras.

Atualmente, o controle é realizado de forma:

- Manual (papel ou planilhas)  
- Descentralizada  
- Pouco integrada  

Isso gera diversos problemas, como:

- Desperdício de materiais e custos não previstos  
- Atrasos por falta de insumos no momento da execução  
- Dificuldade em traduzir documentos técnicos (ex: Memorial Descritivo) em ações práticas  

---

### 1.2 Origem da Demanda e Evidências

A demanda surge da necessidade de:

- Pequenos empreiteiros  
- Mestres de obra  
- Proprietários de obras  

Esses usuários não possuem acesso a sistemas ERP complexos devido a:

- Alto custo  
- Elevada complexidade  

**Evidência de interesse:**  
Estudos e observações do setor indicam que o fluxo de informação descontínuo é uma das principais dores na construção civil.

O sistema proposto atua como uma ponte entre:

- Documentação técnica (projeto/memorial)  
- Execução operacional da obra  

---

### 1.3 Análise de Soluções Existentes (Benchmark)

#### 1. Sienge
- **Pontos Fortes:** Plataforma completa e integrada  
- **Limitações:** Alto custo e curva de aprendizado elevada  

#### 2. Prevision
- **Pontos Fortes:** Foco em planejamento e cronogramas  
- **Limitações:** Voltado para grandes obras e planejamento macro  

#### 3. Planilhas Excel
- **Pontos Fortes:** Baixo custo e flexibilidade  
- **Limitações:**  
  - Falta de rastreabilidade  
  - Dados fragmentados  
  - Propenso a erros  

---

### Comparação Geral

| Solução      | Pontos Fortes              | Limitações                              |
|--------------|---------------------------|------------------------------------------|
| Sienge       | Completo e integrado      | Custo elevado e complexidade             |
| Planilhas    | Baixo custo e flexível    | Sem rastreabilidade, sujeito a erros     |
| ConstruPlan  | Foco no memorial técnico  | Escopo inicial limitado                  |

---

### Diferencial do Projeto

O **Build-Plan** tem como principal diferencial:

- Transformar o *Memorial Descritivo* em uma estrutura digital  
- Permitir extração assistida de materiais  
- Vincular materiais diretamente às etapas da obra  

Isso reduz a distância entre planejamento e execução.

---

### 1.4 Público-Alvo

O sistema é destinado a:

- Pequenos empreiteiros e mestres de obra  
- Arquitetos e engenheiros autônomos  
- Proprietários de obras (pessoa física)  

---

### 1.5 Objetivos do Projeto

#### Objetivo Geral

Desenvolver um sistema web para apoiar a gestão da construção, organizando:

- Etapas  
- Materiais  
- Necessidades de compra  

A partir de documentos técnicos.

---

#### Objetivos Específicos

- Implementar extração assistida de materiais a partir do Memorial Descritivo  
- Vincular materiais a etapas e locais da obra (ex: fundação, alvenaria)  
- Gerar planos de aquisição com base no cronograma  

---

### 1.6 Métricas de Sucesso (KPIs)

O sucesso do projeto será avaliado com base nos seguintes indicadores:

- **Redução do tempo de levantamento de materiais**  
  Comparado ao método manual  

- **Precisão das listas de compra**  
  - Meta: > 90% de assertividade  

- **Satisfação do usuário**  
  - Clareza na rastreabilidade de materiais  
  - Facilidade de uso do sistema  

---

## 2. Engenharia de Requisitos

Esta seção define as funcionalidades e restrições do sistema **Build-Plan**, com foco na transformação de dados técnicos em suporte à tomada de decisão.

---

### 2.1 Personas

#### Persona 1: Ricardo (Empreiteiro Autônomo)

- **Contexto:**  
  Gerencia de 2 a 3 obras simultâneas de pequeno porte  

- **Objetivos:**  
  - Saber exatamente o que comprar para a próxima semana  
  - Evitar falta de material no canteiro  

- **Dificuldades:**  
  - Perda de tempo buscando informações em PDFs  
  - Dependência de conversas em WhatsApp  
  - Falta de organização centralizada  

---

#### Persona 2: Ana (Proprietária da Obra)

- **Contexto:**  
  Pessoa física construindo sua primeira casa  

- **Objetivos:**  
  - Acompanhar o progresso da obra  
  - Entender onde os materiais estão sendo utilizados  

- **Dificuldades:**  
  - Falta de conhecimento técnico  
  - Insegurança quanto à transparência no uso dos insumos  

---

### 2.2 Casos de Uso Principais

- **UC01 — Importar Memorial Descritivo**  
  O usuário insere o texto ou documento técnico para iniciar a extração de insumos  

- **UC02 — Vincular Material à Etapa**  
  O gestor associa um material específico a uma fase da obra (ex: cimento → fundação)  

- **UC03 — Gerar Plano de Aquisições**  
  O sistema identifica os materiais necessários com base na etapa atual  

- **UC04 — Atualizar Rastreabilidade**  
  O usuário altera o status do material (ex: de *Previsto* para *Aplicado*)  

---

### 2.3 Requisitos Funcionais (RF)

- **RF01 — Cadastro de Obra e Ambientes**  
  Permitir organizar a construção em unidades lógicas (fundação, alvenaria, acabamento)  

- **RF02 — Importação de Documentos**  
  Permitir o uso do memorial descritivo como fonte primária de dados  

- **RF03 — Catálogo de Insumos**  
  Permitir cadastro de materiais com especificações, unidades e quantidades  

- **RF04 — Associação Dinâmica**  
  Permitir vincular materiais a uma ou mais etapas e locais da obra  

- **RF05 — Relatório de Compras**  
  Gerar listas de compras organizadas por fase da obra  

- **RF06 — Monitoramento de Status**  
  Acompanhar o ciclo de vida do material (previsto → recebido → aplicado)  

---

### 2.4 Requisitos Não Funcionais (RNF)

- **RNF01 — Usabilidade**  
  Interface simples e intuitiva, adequada para usuários não técnicos  

- **RNF02 — Confiabilidade**  
  Validação de dados para evitar inconsistências e duplicações  

- **RNF03 — Recuperação de Informação**  
  Busca rápida por materiais, etapas ou ambientes  

- **RNF04 — Auditabilidade**  
  Registro histórico de alterações para rastreabilidade e segurança  

---

### 2.5 Regras de Negócio

- **RN01**  
  Um material só pode ser marcado como *Aplicado* se estiver previamente com status *Recebido*  

- **RN02**  
  A exclusão de uma etapa deve alertar sobre materiais vinculados que ficarão sem associação  

- **RN03**  
  Quantidades de materiais não podem assumir valores negativos  

---

### 2.6 Fora do Escopo

Para garantir a viabilidade do projeto de graduação, os seguintes itens não fazem parte do escopo:

- Módulo financeiro completo (contas a pagar, fluxo de caixa, impostos)  
- Integração com softwares BIM (Building Information Modeling)  
- Aplicativo mobile nativo (o sistema será web responsivo)  
- Leitura automática de PDF com alta precisão (extração será assistida/manual)  
- Sistema multiusuário com hierarquia complexa de permissões  

---

## 3. Fluxos e Comportamento do Sistema

### 3.1 Fluxo Principal do Usuário — UC01: Importação do Memorial Descritivo
O fluxo de importação é o ponto de entrada do sistema. A partir dele, o catálogo de insumos é formado e serve de base para os demais módulos (cronograma, compras, alertas).
* **Fluxograma:**
*  <img width="741" height="1421" alt="Diagrama em branco - Fluxograma de importação" src="https://github.com/user-attachments/assets/3e22774c-03b5-4673-a9e3-fd195a67e088" />

* **Diagrama de atividades:**
* <img width="1000" height="1560" alt="Diagrama em branco - Atividade importação" src="https://github.com/user-attachments/assets/9c9c61bd-02c2-4e16-9233-cc2b4ddc0ff9" />


#### Fluxos Alternativos (UC01)
* **FA01 — Documento inválido:** Caso o arquivo enviado não atenda aos critérios de validação (formato não suportado, arquivo corrompido ou conteúdo ilegível), o sistema exibe uma mensagem de erro descritiva e retorna o usuário à tela de importação para uma nova tentativa.
* **FA02 — Adição manual de material:** Após a revisão da lista extraída, o usuário pode identificar insumos ausentes. Nesse caso, aciona o cadastro manual, informa nome, unidade e quantidade do material, e este é incorporado ao catálogo antes da vinculação às etapas.
* **FA03 — Edição ou remoção de item extraído:** Durante a revisão, itens incorretamente identificados podem ser editados ou removidos. O sistema não persiste nenhum dado antes da confirmação explícita do usuário.

### 3.2 Fluxo Principal do Usuário — UC02: Vincular Material à Etapa
Após o catálogo de insumos ser formado (via UC01), o usuário associa cada material à etapa da obra em que será utilizado. Esse vínculo alimenta diretamente o cronograma e as listas de compras.
* **Fluxograma:**
* <img width="825" height="1801" alt="Diagrama - UC02" src="https://github.com/user-attachments/assets/b84a3132-c744-4cae-a21b-689b342e21b4" />

* **Diagrama de atividades:**
* <img width="1000" height="1560" alt="Diagrama Atividade - UC02" src="https://github.com/user-attachments/assets/b825377d-b2e9-48f6-8311-a96b0da2a568" />


#### Fluxos Alternativos (UC02)
* **FA01 — Etapa não cadastrada:** Se o usuário tentar vincular um material a uma etapa que ainda não existe, o sistema sugere a criação de uma nova etapa. O usuário nomeia a etapa e o fluxo retorna à verificação, seguindo normalmente.
* **FA02 — Vínculo duplicado:** Caso o material já esteja associado à etapa selecionada, o sistema alerta a duplicidade e pergunta se o usuário deseja atualizar a quantidade prevista ou cancelar a operação. Nenhum dado é sobrescrito sem confirmação explícita.
* **FA03 — Repetição para múltiplos materiais:** Após registrar um vínculo com sucesso, o usuário pode optar por vincular outro material sem sair do fluxo, retornando à seleção do catálogo.

### 3.3 Fluxo Principal do Usuário — UC03: Gerar Plano de Aquisições
Com os materiais já vinculados às etapas (UC02), o usuário solicita a geração da lista de compras. O sistema compila os insumos com status Previsto ou Recebido, aplica a estimativa de preço disponível e apresenta a lista organizada por etapa.
* **Fluxograma:**
* <img width="406" height="828" alt="UC03 - Gerar Plano de Aquisições 1" src="https://github.com/user-attachments/assets/9a61b0b7-54af-492d-a232-458e0fd9884c" />

* **Diagrama de atividades:**
* <img width="1101" height="1418" alt="UC03 - Plano de aquisições(diagrama de atividade)" src="https://github.com/user-attachments/assets/12c05d84-aef5-4152-b864-903bab3d878c" />



#### Fluxos Alternativos (UC03)
* **FA01 — Etapa sem materiais vinculados:** Se a etapa selecionada não possuir nenhum insumo associado, o sistema exibe um aviso informativo. O usuário pode retornar ao UC02 para realizar os vínculos ou selecionar outra etapa.
* **FA02 — Material sem estimativa de preço:** Quando um material não possui preço de referência cadastrado (nem via SINAPI nem manual), o item é incluído na lista marcado como "sem estimativa", sem bloquear a geração dos demais. O usuário pode preencher o preço manualmente após a geração.
* **FA03 — Exportação da lista:** Após revisar a lista exibida, o usuário pode optar por exportá-la em PDF ou CSV. O sistema gera o arquivo e o disponibiliza para download. Caso o usuário não exporte, a lista permanece acessível no sistema.

### 3.4 Fluxo Principal do Usuário — UC04: Atualizar Rastreabilidade do Material
Após o catálogo estar montado e os vínculos definidos, o usuário acompanha o ciclo de vida de cada material ao longo da execução da obra. O sistema garante que as transições sigam a ordem estabelecida pelas regras de negócio (RN01) e registra um log auditável de cada alteração.
* **Fluxograma:**
* <img width="1033" height="1511" alt="UC04 - Rastreabilidade do material" src="https://github.com/user-attachments/assets/34c25851-95e3-40f0-8e8b-2883cd7a0f22" />

* **Diagrama de atividades:**
* <img width="1107" height="1410" alt="UC04 - Rastreabilidade de materiais (Diagrama de atividades)" src="https://github.com/user-attachments/assets/35f9966a-6905-4154-8106-a02880cfc21a" />


#### Fluxos Alternativos (UC04)
* **FA01 — Transição de status inválida:** O sistema bloqueia qualquer tentativa de marcar um material como Aplicado sem que ele esteja previamente com status Recebido, conforme a RN01. Uma mensagem explica o motivo do bloqueio e orienta o usuário a realizar a transição correta.
* **FA02 — Dados complementares obrigatórios:** Dependendo do status destino, o sistema solicita informações adicionais: para Recebido, data e quantidade entregue; para Aplicado, local de uso e data de aplicação. A confirmação só é aceita com todos os campos preenchidos.
* **FA03 — Alerta de prazo automático:** Ao atualizar o status de um material, o sistema verifica se a próxima etapa da obra está dentro da janela de alerta configurada (ex.: 20 dias). Em caso positivo, emite uma notificação ao usuário sugerindo a geração da lista de compras da etapa seguinte.

---

## 4. Mockups e Experiência do Usuário (UX)

Esta seção apresenta a visualização inicial das interfaces, a arquitetura da informação e o fluxo de interação detalhado do sistema Build-Plan antes da codificação das rotas dinâmicas em Django. O design prioriza uma experiência fluida de controle operacional de insumos e etapas diretamente associadas a documentos de engenharia civil.

### 4.1 Fluxo de Navegação

A arquitetura de navegação foi projetada de forma modular. O utilizador parte de uma visão macro multiobras para gerir contextos operacionais isolados de planejamento, compras e logs históricos de um canteiro ativo.

<img width="1195" height="772" alt="Captura de tela 2026-05-24 013036" src="https://github.com/user-attachments/assets/067dd2de-07ea-4400-9064-5feebc44297b" />


### 4.2 Wireframes ou Mockups das Telas

#### Tela 1: Seleção e Gestão de Múltiplas Obras 
* **Descrição da Funcionalidade:** Tela de entrada global do sistema que implementa o conceito de múltiplos projetos (Multi-tenancy). Apresenta cartões que resumem o progresso físico geral da construção, localização e sinaliza pendências críticas como a falta de importação de documentos.
* **Ações Principais do Usuário:** Selecionar uma obra ativa para carregar o contexto no Dashboard geral; acionar o botão "Cadastrar Nova Obra".

<img width="1395" height="717" alt="Captura de tela 2026-05-24 010515" src="https://github.com/user-attachments/assets/c95f94a7-8ab2-4569-8fd7-d5aeea25fa39" />


#### Tela 2: Dashboard de Controle Operacional 
* **Descrição da Funcionalidade:** Painel principal da obra em andamento. Centraliza indicadores quantitativos de materiais, exibe o progresso das etapas por meio de barras gráficas e reúne alertas críticos sobre o cronograma de suprimentos (ex: início iminente de novas fases).
* **Ações Principais do Usuário:** Clicar no botão "Trocar obra" para retornar ao nível global; navegar no menu lateral; acionar o link rápido "Ver ↗" na tabela de insumos recentes.

<img width="1436" height="758" alt="Captura de tela 2026-05-24 005445" src="https://github.com/user-attachments/assets/d8289fb0-1bab-42b6-a19e-08361d0203ea" />

#### Tela 3: Importação de Memorial com Extração Assistida 
* **Descrição da Funcionalidade:** Interface dedicada à conversão de engenharia de dados. Na coluna esquerda, aceita o carregamento de arquivos ou a colagem de trechos textuais do Memorial Descritivo. Na coluna direita, exibe de forma preditiva os insumos identificados pela extração assistida, organizando-os por status de confirmação humana antes do salvamento.
* **Ações Principais do Usuário:** Colar o escopo do memorial; disparar o botão "Extrair materiais"; marcar ou desmarcar as caixas de verificação (checkboxes) para validar e salvar os itens propostos.

<img width="1435" height="719" alt="Captura de tela 2026-05-24 005509" src="https://github.com/user-attachments/assets/fc49fb16-348c-4d58-bd56-547d178d0677" />


#### Tela 4: Catálogo de Insumos e Vínculos 
* **Descrição da Funcionalidade:** Inventário relacional que gerencia a associação muitos-para-muitos entre insumos e etapas da construção. O painel lateral detalha as estimativas orçamentárias parciais associadas a tabelas de referência, os locais de aplicação do canteiro e um resumo histórico rápido de movimentações.
* **Ações Principais do Usuário:** Buscar materiais por texto; filtrar por status operacionais ou fases construtivas; acionar o link para a tela de auditoria completa.

<img width="1436" height="733" alt="Captura de tela 2026-05-24 005525" src="https://github.com/user-attachments/assets/06cef0b6-4b8b-4f8a-a6ea-689f04f04e1f" />


#### Tela 5: Lista de Compras Paramétrica 
* **Descrição da Funcionalidade:** Plano de aquisições dinâmico segmentado em abas por etapas construtivas. A tabela cruza os quantitativos levantados no memorial com as referências de custo oficial do SINAPI, destacando em tempo real itens sem estimativa para precificação manual de cotação de mercado.
* **Ações Principais do Usuário:** Alternar entre abas de etapas; clicar em "Informar" para adicionar preços manualmente; exportar a listagem consolidada de insumos nos formatos PDF ou CSV.

<img width="1438" height="779" alt="Captura de tela 2026-05-24 005541" src="https://github.com/user-attachments/assets/9ad288f7-a9e5-4601-b862-ce275fa9092b" />


#### Tela 6: Rastreabilidade Avançada e Log de Auditoria 
* **Descrição da Funcionalidade:** Tela voltada ao cumprimento do requisito não funcional de integridade e auditoria de segurança da informação. Disponibiliza uma linha do tempo (Timeline) vertical imutável detalhando todo o ciclo de vida do insumo selecionado, documentando de forma explícita quem realizou a ação, quando ocorreu e o que foi modificado.
* **Ações Principais do Usuário:** Selecionar insumos na listagem; acionar o botão de alteração de status físico de controle de campo (ex: de "Recebido" para "Aplicado").

<img width="1431" height="859" alt="Captura de tela 2026-05-24 005600" src="https://github.com/user-attachments/assets/96673621-03fd-41e1-8402-89c4cb61d996" />


### 4.3 Fluxo de Interação do Usuário

A sequência abaixo mapeia o fluxo crítico de valor que soluciona o problema de desperdício e ruído informacional abordado na pesquisa:

1. **Ativação do Contexto:** O gestor acessa a plataforma, visualiza sua listagem global e escolhe a obra ativa clicando em seu card explicativo.
2. **Transformação de Entrada Documental:** O usuário acessa o módulo de Importação e insere o texto bruto do Memorial Descritivo técnico de um ambiente da obra.
3. **Mapeamento e Filtro Assistido:** Ao clicar em Extrair materiais, o sistema renderiza os insumos propostos na coluna lateral de revisão. O gestor realiza o ajuste fino dos quantitativos e clica em Confirmar e ir para o catálogo para persistir os dados no banco relacional.
4. **Análise de Plano de Aquisições:** Na aba Compras, o gestor confere o custo gerado automaticamente com base na tabela SINAPI e exporta a lista de compras limpa para o fornecedor.
5. **Alimentação de Logs em Campo:** No momento da entrega dos materiais físicos, o gestor acessa a Rastreabilidade, seleciona o insumo e altera seu status para "Recebido", gerando de forma automática e cronológica os logs imutáveis de auditoria.

## 5. Arquitetura do Sistema

### 5.1 Diagrama C4

#### Nível 1 — Diagrama de Contexto

O Build-Plan recebe interações de dois perfis de usuário: o gestor de obra (empreiteiro, arquiteto ou mestre de obra) e o proprietário, que acompanha o andamento sem interação técnica. O sistema consome dois serviços externos: a tabela SINAPI para estimativas de preço de materiais, e um provedor SMTP para envio de alertas e notificações de prazo.

<img width="1195" height="1306" alt="C4 - Contexto" src="https://github.com/user-attachments/assets/4332a572-b468-438c-b1d3-a0ad4a88d177" />


---

#### Nível 2 — Diagrama de Containers

O sistema é composto por quatro containers internos. O frontend é uma SPA em React, responsável por toda a interface do usuário e comunicando com o backend via REST sobre HTTPS. A API REST em Node.js centraliza a lógica de negócio e serve como único ponto de entrada para os dados. O banco PostgreSQL persiste todos os dados relacionais da aplicação. O Alert Worker é um processo interno acionado periodicamente para verificar prazos de etapas e disparar notificações via SMTP.

<img width="1468" height="1063" alt="C4 - Container" src="https://github.com/user-attachments/assets/2ac27363-9324-41e3-9905-1282ce07c4bd" />


---

#### Nível 3 — Diagrama de Componentes

A API é organizada em três camadas. Os Controllers recebem as requisições HTTP e delegam a responsabilidade aos Services, sem conter lógica de negócio. Os Services encapsulam as regras do domínio — validações, cálculos de estimativa, verificação de transições de status e consultas ao SINAPI. Os Repositories isolam o acesso ao banco de dados, garantindo que nenhuma query SQL esteja espalhada pelo código de negócio.

<img width="1420" height="1100" alt="C4 - Componentes" src="https://github.com/user-attachments/assets/0c1f591d-9020-4890-b19e-1f570770d391" />


---

### 5.2 Modelo de Dados

O modelo é relacional e organizado em torno da entidade `Obra`, que agrega etapas, materiais e listas de compras.

<img width="5314" height="8192" alt="Build-Plan DER" src="https://github.com/user-attachments/assets/7692a8be-7920-4f04-9415-bda17baf3692" />


**Decisões de modelagem relevantes:**

`MATERIAL` pertence diretamente à `OBRA`, não à etapa. O vínculo com etapas é feito pela tabela associativa `VINCULO_MATERIAL_ETAPA`, que permite que um mesmo material apareça em múltiplas etapas com quantidades distintas e status independentes. Isso implementa a RN01 (um material só pode ser marcado como *Aplicado* se estiver *Recebido*) diretamente no campo `status` dessa tabela.

`LISTA_COMPRAS` é gerada por etapa e é um snapshot — ela não é recalculada automaticamente a cada alteração do catálogo, mas sim acionada pelo usuário. `ITEM_COMPRA` armazena o preço no momento da geração, preservando o histórico mesmo que o preço de referência mude depois.

`LOG_RASTREABILIDADE` registra cada transição de status do vínculo, com referência ao usuário que a executou e ao status anterior, garantindo a auditabilidade exigida pelo RNF04.

O campo `origem` em `MATERIAL` distingue se o insumo foi extraído do memorial (`"memorial"`) ou cadastrado manualmente (`"manual"`), permitindo rastrear a procedência de cada item do catálogo.

---

### 5.3 Principais Componentes

O sistema é organizado nos seguintes módulos: gerenciamento de obras e etapas, catálogo de insumos com extração assistida, motor de vínculos material-etapa, gerador de listas de compras com estimativas de preço e worker de verificação de alertas de prazo.

O projeto adota TDD como prática de desenvolvimento, com testes escritos previamente à implementação usando Jest e Supertest. O pipeline de CI/CD é gerenciado via GitHub Actions, automatizando a execução de testes e o deploy a cada push na branch principal.

---

### 5.4 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | React + Vite + TypeScript | Ecossistema consolidado, SPA com boa experiência de desenvolvimento e grande oferta de material didático |
| Backend | Node.js + Express + TypeScript | Leve, assíncrono e com vasta documentação; ideal para APIs REST de médio porte |
| Banco de dados | PostgreSQL | Relacional com suporte robusto a transações; garante a integridade dos vínculos material-etapa |
| ORM | Prisma | Migrations automáticas, tipagem forte e sintaxe intuitiva para nível intermediário |
| Containerização | Docker + Docker Compose | Garante portabilidade e consistência entre ambientes de desenvolvimento e produção |
| Deploy | AWS EC2 / Heroku / Google Cloud Run | Serviços de cloud com controle real sobre infraestrutura, alinhados com as diretrizes do projeto |
| CI/CD | GitHub Actions | Automatiza build, testes e deploy — requisito obrigatório pelas diretrizes do curso |
| Testes | Jest + Supertest | Suporte a TDD — testes escritos antes da implementação, requisito obrigatório pelas diretrizes |
| Documentação | Wiki do GitHub | Documentação técnica junto ao repositório, facilitando acesso e colaboração — requisito obrigatório |
| Alertas | Node-cron | Agendamento simples de tarefas periódicas dentro do próprio processo Node |
| Autenticação | JWT + bcrypt | Padrão consolidado para APIs stateless sem necessidade de servidor de sessão |

---

## 6. Segurança e Privacidade

### 6.1 Segurança da Aplicação

O Build-Plan adota práticas de segurança baseadas no OWASP Top 10, priorizando as vulnerabilidades mais comuns em aplicações web.

#### Autenticação e Autorização

- Autenticação via **JWT (JSON Web Token)** com expiração configurável (padrão: 8h)
- Senhas armazenadas com hash **bcrypt** (fator de custo mínimo 12)
- Rotas protegidas por middleware de verificação de token em todas as requisições autenticadas
- Cada usuário acessa apenas obras que lhe pertencem — validação de propriedade em nível de Service antes de qualquer operação

#### Proteção contra ataques comuns (OWASP Top 10)

| Risco | Medida adotada |
|---|---|
| Injeção SQL | Uso do ORM Prisma com queries parametrizadas — nenhuma query SQL montada manualmente |
| Quebra de autenticação | JWT com assinatura HS256, expiração curta e validação em cada requisição |
| Exposição de dados sensíveis | HTTPS obrigatório em produção; senhas nunca retornadas nas respostas da API |
| Controle de acesso quebrado | Verificação de propriedade do recurso em nível de Service (ex: obra pertence ao usuário autenticado) |
| Configuração incorreta | Variáveis de ambiente para credenciais; `.env` fora do repositório |
| Cross-Site Scripting (XSS) | Sanitização de entradas no frontend; React escapa conteúdo por padrão |
| Componentes vulneráveis | Dependências monitoradas via `npm audit` integrado ao pipeline CI/CD |

#### Validação de dados

- Validação de entrada em todas as rotas da API com biblioteca **Zod**
- Retorno de mensagens de erro genéricas ao cliente — detalhes internos não expostos
- Limitação de tamanho de payload nas requisições (proteção contra ataques de sobrecarga)

---

### 6.2 Privacidade e LGPD

O Build-Plan coleta e processa dados pessoais dos usuários. A seguir estão descritos os dados coletados, a finalidade de uso e os direitos garantidos ao titular.

#### Dados coletados

| Dado | Finalidade | Armazenamento |
|---|---|---|
| Nome completo | Identificação do usuário no sistema | Banco de dados — PostgreSQL |
| Endereço de e-mail | Login e alertas de prazo | Banco de dados — PostgreSQL |
| Senha (hash) | Autenticação segura | Banco de dados — hash bcrypt, nunca em texto puro |
| Dados de obras e materiais | Funcionalidade central do sistema | Banco de dados — vinculados ao usuário |
| Logs de rastreabilidade | Auditabilidade das operações | Banco de dados — com referência ao usuário executor |

O sistema **não coleta** dados de localização, dados bancários, documentos de identificação ou qualquer dado sensível nos termos do Art. 5º da LGPD.

#### Direitos do titular (Art. 18 da LGPD)

O usuário poderá, a qualquer momento:

- **Acessar** seus dados pessoais armazenados no sistema
- **Corrigir** dados incompletos ou desatualizados via configurações de perfil
- **Solicitar a exclusão** de sua conta — ao confirmar, todos os dados vinculados são removidos imediatamente do banco de dados
- **Solicitar cancelamento** de alertas por e-mail via contato com o suporte

#### Retenção de dados

- Dados de obras e materiais são retidos enquanto a conta do usuário estiver ativa
- Após exclusão da conta, todos os dados pessoais são removidos permanentemente
- A política de backup é de responsabilidade do provedor de cloud utilizado no deploy

#### Consentimento

- O usuário consente com a política de privacidade no momento do cadastro


---




## 7. Planejamento do Projeto

O projeto é desenvolvido individualmente, adotando **Kanban** como metodologia de gestão de tarefas, com acompanhamento via GitHub Projects. O desenvolvimento segue **TDD** e os marcos abaixo consideram uma dedicação realista de projeto de graduação — aproximadamente 10 a 15 horas semanais.

| Marco | Descrição | Entregáveis | Prazo estimado |
|---|---|---|---|
| **M1** | Setup e fundação | Repositório configurado, Docker Compose funcional, banco de dados com migrations iniciais, pipeline CI/CD básico no GitHub Actions, wiki iniciada | Semana 1–2 |
| **M2** | Autenticação e gestão de obras | Cadastro e login de usuário (JWT), CRUD de obras e etapas, testes unitários das rotas | Semana 3–4 |
| **M3** | Catálogo de insumos | Cadastro manual de materiais, vínculo material-etapa, validações de negócio (RN01–RN03) e testes | Semana 5–6 |
| **M4** | Importação do memorial | Entrada de texto do memorial, extração assistida de materiais, revisão e confirmação do catálogo | Semana 7–8 |
| **M5** | Lista de compras e estimativas | Geração da lista por etapa, integração com SINAPI, exportação PDF/CSV | Semana 9–10 |
| **M6** | Rastreabilidade e alertas | Ciclo de vida do material (Previsto → Recebido → Aplicado), log de auditoria, worker de alertas de prazo | Semana 11–12 |
| **M7** | Ajustes, testes e entrega | Correção de bugs, cobertura de testes, documentação final na wiki, deploy em produção | Semana 13–14 |

### Observações

- Cada marco encerra com os testes escritos e passando — nenhum marco avança com testes quebrados
- O M4 é o marco de maior risco técnico; caso necessite de ajuste de escopo, a extração pode ser simplificada para entrada manual pura sem impactar os demais módulos
- A wiki do GitHub é atualizada ao final de cada marco

----

## 8. Referências

### Documentação técnica

- React — https://react.dev/
- Node.js — https://nodejs.org/en/docs
- Express.js — https://expressjs.com/
- Prisma ORM — https://www.prisma.io/docs
- PostgreSQL — https://www.postgresql.org/docs/
- Docker — https://docs.docker.com/
- GitHub Actions — https://docs.github.com/en/actions
- Jest — https://jestjs.io/docs/getting-started
- Zod — https://zod.dev/
- JSON Web Token (JWT) — https://jwt.io/introduction
- bcrypt — https://www.npmjs.com/package/bcrypt
- Node-cron — https://www.npmjs.com/package/node-cron

### Arquitetura e modelagem

- C4 Model — Simon Brown — https://c4model.com/
- OWASP Top 10 — https://owasp.org/www-project-top-ten/

### Dados e referências de preço

- SINAPI — Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil — https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/

### Legislação

- Lei Geral de Proteção de Dados Pessoais (LGPD) — Lei nº 13.709/2018 — https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

### Metodologias

- Kanban — https://kanbanize.com/kanban-resources/getting-started/what-is-kanban
- TDD (Test-Driven Development) — Kent Beck, *Test-Driven Development: By Example*, Addison-Wesley, 2002
- SOLID e Clean Code — https://bit.ly/3tbawbD e https://bit.ly/3E7AaDx

---

## 9. Apêndices

---

### Apêndice A - Memorial Descritivo de Exemplo (Entrada do Sistema)

**Nota do Apêndice:** *Este memorial descritivo é um exemplo fictício elaborado para fins de demonstração do Build-Plan. Sua estrutura foi baseada nos padrões estabelecidos pela ABNT NBR 12721 e em modelos reais de memoriais utilizados em habitações populares e de médio padrão no Brasil. O documento ilustra o tipo de entrada que o módulo de importação do sistema deve ser capaz de processar, incluindo especificações em texto corrido, listas de materiais com traços e dimensões, e tabelas de acabamentos por ambiente.*

#### 1. Dados de Identificação do Empreendimento

| Campo | Informação |
| :--- | :--- |
| **Empreendimento** | Residência Unifamiliar — Lote 14 |
| **Endereço** | Rua das Orquídeas, 320 — Bairro Jardim Europa |
| **Cidade / UF** | Joinville / SC |
| **Proprietário** | Carlos Henrique Souza (CPF: 000.000.000-00) |
| **Construtora Responsável** | Obras & Cia Ltda (CNPJ: 00.000.000/0001-00) |
| **Padrão de Acabamento** | MÉDIO (NBR 12721) |
| **Área construída** | 142,56 m² |
| **Data do documento** | Maio de 2026 |

#### 2. Infraestrutura e Estrutura

**2.1 Fundação**
A fundação será executada em radier armado, com as seguintes especificações:
* **Tipo:** Radier em concreto armado
* **Resistência do concreto:** fck = 20 MPa
* **Espessura da laje:** 10 cm
* **Armadura principal:** CA-50, Ø 10 mm, espaçamento de 20 cm (bidirecional)
* **Armadura de temperatura:** CA-60, Ø 4,2 mm, malha Q-138
* **Impermeabilização:** manta asfáltica de 4 mm aplicada sob a laje

**2.2 Estrutura de Concreto Armado**
Pilares, vigas e lajes serão executados em concreto armado conforme projeto estrutural:
* **Resistência do concreto:** fck = 25 MPa
* **Aço estrutural:** CA-50 e CA-60 conforme especificações de projeto
* **Fôrmas:** tábuas tipo 3A 4X ou compensado laminado de alta resistência
* **Laje de piso:** pré-moldada convencional com espessura de 12 cm (vigota 8 cm + capa 4 cm)

#### 3. Vedações e Alvenaria
As paredes serão erguidas em bloco cerâmico furado com as seguintes especificações:
* **Bloco cerâmico:** 8 furos, dimensões nominais 9×14×19 cm
* **Argamassa de assentamento:** cimento, cal e areia no traço 1:2:8
* **Cinta de respaldo:** executada em bloco calha (10×20×20 cm) com armadura de 2 ferros Ø 6,3 mm
* **Vergas e contravergas:** pré-moldadas em concreto armado de seção 10×10 cm, transpasse mínimo de 20 cm
* **Revestimento interno:** chapisco + emboço desempenado + reboco liso, espessura total de 2,5 cm
* **Revestimento externo:** chapisco + emboço paulistinha texturizado, espessura total de 2,0 cm

#### 4. Cobertura
* **Estrutura:** tesoura em madeira tratada (Pinus ou similar), com inclinação de 30%
* **Telha:** cerâmica tipo colonial, cor terracota
* **Impermeabilização:** manta asfáltica 4 mm nas calhas e rufos
* **Calhas e rufos:** alumínio anodizado, largura de 20 cm
* **Forro:** PVC branco, espessura 8 mm, instalado em todos os ambientes internos

#### 5. Mapa de Esquadrias

| Ambiente | Tipo | Material | Dimensões (m) | Observações |
| :--- | :--- | :--- | :--- | :--- |
| **Sala / Acesso** | Porta de entrada | Marco chapa 18 / Folha chapa 16 | 0,90 × 2,10 | Fechadura com cilindro duplo |
| **Sala** | Janela de correr | Alumínio anodizado | 1,50 × 1,20 | Vidro liso 4 mm, com tela |
| **Dormitórios** | Porta interna | Marco chapa 18 / Folha chapa 20 | 0,70 × 2,10 | Fechadura soprano popular |
| **Dormitórios** | Janela de correr | Alumínio anodizado | 1,20 × 1,20 | Vidro liso 4 mm, com tela |
| **Banheiro** | Porta interna | Marco chapa 18 / Folha chapa 20 | 0,60 × 2,10 | Fechadura livre/ocupado |
| **Banheiro** | Janela basculante | Alumínio anodizado | 0,60 × 0,60 | Vidro fantasia 3 mm |
| **Cozinha** | Janela de correr | Alumínio anodizado | 1,20 × 1,00 | Vidro liso 4 mm |
| **Área de serviço**| Porta externa | Marco chapa 18 / Folha chapa 20 | 0,80 × 2,10 | Trinco de ferro polido |

#### 6. Instalações

**6.1 Instalações Hidrossanitárias**
* **Tubulação de água fria:** PVC rígido soldável, Ø 25 mm (alimentação principal)
* **Tubulação de esgoto:** PVC série normal, Ø 100 mm (esgoto) e Ø 50 mm (águas servidas)
* **Reservatório:** caixa d'água em polietileno com capacidade de 1.000 L, instalada em suporte metálico
* **Caixa de gordura:** pré-moldada sob calçada, com tampa removível
* **Fossa e sumidouro:** executados em alvenaria de tijolo, com lastro de concreto de 5 cm

**6.2 Instalações Elétricas**
* **Padrão de entrada:** conforme normas da concessionária local (CELESC)
* **Quadro de distribuição:** embutido, com disjuntores termomagnéticos e DR
* **Fiação:** cabos de cobre flexível, seção mínima de 2,5 mm² para tomadas e 1,5 mm² para iluminação
* **Eletrodutos:** PVC rígido embutido em alvenaria, Ø 20 mm e Ø 25 mm
* **Tomadas e interruptores:** padrão NBR 14136 (padrão brasileiro), instalação a 1,10 m do piso

#### 7. Memorial de Acabamentos (NBR 12721 — Quadro VII)

| Dependência | Piso | Parede | Teto | Metais e Louças |
| :--- | :--- | :--- | :--- | :--- |
| **Sala de Estar** | Porcelanato retificado 60×60 cm — Eliane ou similar | Gesso liso + pintura acrílica fosca branca | Gesso plaquinha + pintura látex PVA | Tomadas e interruptores padrão NBR 14136 |
| **Dormitório 1 (suíte)**| Piso laminado 8 mm AC4 — Eucafloor ou similar | Gesso liso + pintura acrílica fosca branca | Gesso plaquinha + pintura látex PVA | Pontos para cabeamento lógico e TV |
| **Dormitório 2 e 3** | Piso laminado 8 mm AC4 — Eucafloor ou similar | Gesso liso + pintura acrílica fosca branca | Gesso plaquinha + pintura látex PVA | Pontos para TV |
| **Banheiro Social** | Cerâmica antiderrapante 45×45 cm — Portobello ou similar | Cerâmica branca 30×60 cm até o teto — Portobello | Gesso acartonado resistente à umidade | Vaso c/ caixa acoplada, torneira bica alta — Deca ou similar |
| **Suíte — Banheiro** | Cerâmica antiderrapante 45×45 cm — Portobello ou similar | Cerâmica branca 30×60 cm até o teto — Portobello | Gesso acartonado resistente à umidade | Vaso c/ caixa acoplada, chuveiro elétrico — Lorenzetti ou similar |
| **Cozinha** | Porcelanato antiderrapante 60×60 cm — Eliane ou similar | Cerâmica 30×60 cm até h = 1,50 m, rejunte epóxi | Gesso resistente à umidade + pintura látex | Torneira de parede c/ arejador NBR 10281, tanque de louça — Deca |
| **Área de Serviço** | Cerâmica antiderrapante 45×45 cm — Eliane ou similar | Pintura acrílica impermeável sobre reboco liso | Teto aparente c/ pintura acrílica texturizada | Tanque de louça branca c/ coluna — Deca ou similar |
| **Garagem** | Concreto desempenado com endurecedor de superfície | Pintura acrílica externa texturizada | Teto aparente c/ pintura acrílica | — |

#### 8. Disposições Finais e Limpeza
Após a conclusão dos serviços, a construtora realizará a limpeza minuciosa de todas as dependências:
* **Revestimentos:** todos os porcelanatos, cerâmicas e azulejos serão lavados e limpos, eliminando resíduos de argamassa e rejuntamento
* **Vidros e esquadrias:** limpos e polidos, livres de respingos de tinta e massa corrida
* **Louças e metais sanitários:** entregues com proteção removida, limpos e testados
* **Sistemas hidráulicos:** todas as tubulações, calhas e sifões serão testados para verificar escoamento pleno

*(Fim do Modelo)*

---

# 10. Parecer do Comitê de Avaliação

(A ser preenchido pelos professores)

**Avaliador 1:** __________________________  
**Status:** [ ] Aprovado  [ ] Ajustar

Observações:

---

**Avaliador 2:** __________________________  
**Status:** [ ] Aprovado  [ ] Ajustar

Observações:

---

**Avaliador 3:** __________________________  
**Status:** [ ] Aprovado  [ ] Ajustar

Observações:
