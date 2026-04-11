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