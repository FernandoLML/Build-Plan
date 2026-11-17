// Caminho: /backend/src/services/export/lista-compras.dados.ts
// Modelo de dados neutro usado pelos exportadores da lista de compras (.xlsx e
// .pdf). Os geradores recebem só este formato (sem Prisma), o que os mantém
// puros e testáveis sem banco.

export type OrigemPrecoExportacao = "SINAPI" | "MANUAL" | "PENDENTE";

export interface ItemExportacao {
  codigoSinapi: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number | null;
  origemPreco: OrigemPrecoExportacao;
}

export interface ListaComprasExportacao {
  obraNome: string;
  etapaNome: string; // "Geral" quando a lista não pertence a uma etapa
  geradaEm: Date;
  emitidaEm: Date;
  itens: ItemExportacao[];
}

// Decimal do Prisma (ou qualquer valor com toString()) vindo do banco.
interface DecimalLike {
  toString(): string;
}

export interface ItemCompraBruto {
  materialId: string | null;
  descricao: string;
  unidade: string;
  quantidade: DecimalLike;
  precoUnitario: DecimalLike | null;
  origemPreco: string | null;
}

const ORIGENS_COM_PRECO: ReadonlySet<string> = new Set(["SINAPI", "MANUAL"]);

/**
 * Converte o item persistido para o formato de exportação.
 * Sem preço unitário o item é sempre PENDENTE (mesmo que a origem gravada
 * diga outra coisa); com preço, mantém SINAPI ou cai para MANUAL.
 */
export function paraItemExportacao(
  item: ItemCompraBruto,
  codigosPorMaterial: ReadonlyMap<string, string | null>,
): ItemExportacao {
  const precoUnitario = item.precoUnitario === null ? null : Number(item.precoUnitario.toString());
  let origemPreco: OrigemPrecoExportacao = "PENDENTE";
  if (precoUnitario !== null) {
    origemPreco = ORIGENS_COM_PRECO.has(item.origemPreco ?? "")
      ? (item.origemPreco as OrigemPrecoExportacao)
      : "MANUAL";
  }

  return {
    codigoSinapi: item.materialId ? (codigosPorMaterial.get(item.materialId) ?? null) : null,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: Number(item.quantidade.toString()),
    precoUnitario,
    origemPreco,
  };
}

/** Subtotal do item (null quando pendente), arredondado a centavos. */
export function subtotalItem(item: ItemExportacao): number | null {
  if (item.precoUnitario === null) return null;
  return Math.round(item.quantidade * item.precoUnitario * 100) / 100;
}

/** Soma dos subtotais dos itens com preço. */
export function totalOrcado(itens: readonly ItemExportacao[]): number {
  const centavos = itens.reduce((acc, item) => acc + Math.round((subtotalItem(item) ?? 0) * 100), 0);
  return centavos / 100;
}

/** "Fundação & Estrutura" -> "fundacao-estrutura" (seguro para nome de arquivo). */
export function slugificar(texto: string): string {
  const slug = texto
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "") // remove os acentos separados pelo NFD
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-") // sequências viram um único "-"
    .replace(/^-/, "")
    .replace(/-$/, "");
  return slug || "lista";
}

/** Nome do arquivo baixado: lista-compras-<etapa>.<extensao>. */
/** Ex.: lista-compras-fundacao.pdf; a versão preto e branco ganha o sufixo "-pb". */
export function nomeArquivoExportacao(
  etapaNome: string,
  extensao: "xlsx" | "pdf",
  tema: "cor" | "pb" = "cor",
): string {
  const sufixo = tema === "pb" ? "-pb" : "";
  return `lista-compras-${slugificar(etapaNome)}${sufixo}.${extensao}`;
}

const FORMATO_DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const FORMATO_MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const FORMATO_QUANTIDADE = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

/** 14/11/2026 15:30 (horário de Brasília). */
export function formatarDataHora(data: Date): string {
  return FORMATO_DATA.format(data).replace(",", "");
}

/** R$ 1.234,56 — espaço comum no lugar do NBSP (fontes padrão do PDF). */
export function formatarMoeda(valor: number): string {
  return FORMATO_MOEDA.format(valor).replaceAll(" ", " ");
}

/** 1.234,5 (até 3 casas, como no banco). */
export function formatarQuantidade(valor: number): string {
  return FORMATO_QUANTIDADE.format(valor);
}
