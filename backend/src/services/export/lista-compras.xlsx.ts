// Caminho: /backend/src/services/export/lista-compras.xlsx.ts
// Gera a lista de compras em .xlsx (exceljs), pensada para virar planilha de
// cotação: preços pendentes ficam em branco e, ao preenchê-los, o Subtotal e o
// Total Orçado são recalculados por fórmula.
//
// Layout:
//   1     faixa de título (marca)
//   3..5  bloco informativo (obra, etapa, datas, contagens)
//   7     cabeçalho da tabela (congelado, com autofiltro)
//   8..   itens (PENDENTE destacado: âmbar claro, ou cinza na versão P&B)
//   +1    Total Orçado = SUM(subtotais)
//   +3    legenda

import ExcelJS from "exceljs";
import { PALETA_COLORIDA, argb, type PaletaExportacao } from "./marca.js";
import {
  formatarDataHora,
  formatarMoeda,
  formatarQuantidade,
  subtotalItem,
  totalOrcado,
  type ItemExportacao,
  type ListaComprasExportacao,
} from "./lista-compras.dados.js";

export const LINHA_CABECALHO = 7;
export const PRIMEIRA_LINHA_ITEM = LINHA_CABECALHO + 1;

export const FORMATO_MOEDA_XLSX = '"R$" #,##0.00';

interface ColunaDef {
  titulo: string;
  min: number;
  max: number;
  alinhamento: "left" | "center" | "right";
}

// Ordem das colunas: A..G.
export const COLUNAS: readonly ColunaDef[] = [
  { titulo: "Código SINAPI", min: 14, max: 18, alinhamento: "center" },
  { titulo: "Descrição do Insumo", min: 30, max: 60, alinhamento: "left" },
  { titulo: "Unidade", min: 9, max: 14, alinhamento: "center" },
  { titulo: "Quantidade", min: 12, max: 18, alinhamento: "right" },
  { titulo: "Preço Unitário", min: 16, max: 22, alinhamento: "right" },
  { titulo: "Subtotal", min: 16, max: 24, alinhamento: "right" },
  { titulo: "Origem do Preço", min: 16, max: 18, alinhamento: "center" },
];

function corOrigem(c: PaletaExportacao, origem: ItemExportacao["origemPreco"]): string {
  if (origem === "SINAPI") return c.destaque;
  if (origem === "PENDENTE") return c.alerta;
  return c.textoSecundario;
}

function bordaFina(c: PaletaExportacao): Partial<ExcelJS.Border> {
  return { style: "thin", color: { argb: argb(c.borda) } };
}

function bordasFinas(c: PaletaExportacao): Partial<ExcelJS.Borders> {
  const borda = bordaFina(c);
  return { top: borda, left: borda, bottom: borda, right: borda };
}

function preenchimento(hex: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: argb(hex) } };
}

function formatoQuantidade(valor: number): string {
  return Number.isInteger(valor) ? "#,##0" : "#,##0.000";
}

/** Texto exibido em cada coluna, usado para dimensionar a largura. */
function textosDoItem(item: ItemExportacao): string[] {
  const subtotal = subtotalItem(item);
  return [
    item.codigoSinapi ?? "—",
    item.descricao,
    item.unidade,
    formatarQuantidade(item.quantidade),
    item.precoUnitario === null ? "" : formatarMoeda(item.precoUnitario),
    subtotal === null ? "" : formatarMoeda(subtotal),
    item.origemPreco,
  ];
}

/** Largura de cada coluna: maior texto (cabeçalho ou itens) + folga, com limites. */
export function calcularLarguras(itens: readonly ItemExportacao[]): number[] {
  const textos = itens.map(textosDoItem);
  return COLUNAS.map((coluna, idx) => {
    const maior = Math.max(coluna.titulo.length, ...textos.map((t) => t[idx].length));
    return Math.min(Math.max(maior + 2, coluna.min), coluna.max);
  });
}

function escreverTitulo(ws: ExcelJS.Worksheet, c: PaletaExportacao): void {
  ws.mergeCells("A1:G1");
  const titulo = ws.getCell("A1");
  titulo.value = "Build-Plan  ·  Lista de Compras";
  titulo.font = { name: "Calibri", size: 16, bold: true, color: { argb: argb(c.textoSobreDestaque) } };
  titulo.fill = preenchimento(c.destaque);
  titulo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 32;
  ws.getRow(2).height = 8;
}

function escreverInformacoes(ws: ExcelJS.Worksheet, c: PaletaExportacao, dados: ListaComprasExportacao): void {
  const pendentes = dados.itens.filter((i) => i.origemPreco === "PENDENTE").length;
  const linhas: [string, string | number, string, string | number][] = [
    ["Obra", dados.obraNome, "Emitida em", formatarDataHora(dados.emitidaEm)],
    ["Etapa", dados.etapaNome, "Gerada em", formatarDataHora(dados.geradaEm)],
    ["Itens", dados.itens.length, "Sem preço", pendentes],
  ];

  linhas.forEach(([rotulo1, valor1, rotulo2, valor2], idx) => {
    const r = 3 + idx;
    ws.mergeCells(`B${r}:D${r}`);
    ws.mergeCells(`F${r}:G${r}`);
    ws.getCell(`A${r}`).value = rotulo1;
    ws.getCell(`B${r}`).value = valor1;
    ws.getCell(`E${r}`).value = rotulo2;
    ws.getCell(`F${r}`).value = valor2;

    for (const col of ["A", "E"]) {
      ws.getCell(`${col}${r}`).font = { bold: true, color: { argb: argb(c.textoSecundario) } };
    }
    for (const col of ["B", "F"]) {
      const cell = ws.getCell(`${col}${r}`);
      cell.font = { color: { argb: argb(c.texto) } };
      cell.alignment = { horizontal: "left" };
    }
    for (const col of ["A", "B", "C", "D", "E", "F", "G"]) {
      ws.getCell(`${col}${r}`).fill = preenchimento(c.fundoAlternado);
    }
  });

  if (pendentes > 0) {
    ws.getCell("F5").font = { bold: true, color: { argb: argb(c.alerta) } };
  }
}

function escreverCabecalhoTabela(ws: ExcelJS.Worksheet, c: PaletaExportacao): void {
  const linha = ws.getRow(LINHA_CABECALHO);
  COLUNAS.forEach((coluna, idx) => {
    const cell = linha.getCell(idx + 1);
    cell.value = coluna.titulo;
    cell.font = { bold: true, color: { argb: argb(c.texto) } };
    cell.fill = preenchimento(c.destaqueClaro);
    cell.border = bordasFinas(c);
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  linha.height = 22;
}

function escreverItem(ws: ExcelJS.Worksheet, c: PaletaExportacao, r: number, item: ItemExportacao): void {
  const linha = ws.getRow(r);
  const subtotal = subtotalItem(item);
  const pendente = item.origemPreco === "PENDENTE";

  linha.getCell(1).value = item.codigoSinapi ?? "—";
  linha.getCell(2).value = item.descricao;
  linha.getCell(3).value = item.unidade;
  linha.getCell(4).value = item.quantidade;
  linha.getCell(5).value = item.precoUnitario;
  linha.getCell(6).value = {
    formula: `IF(ISNUMBER(E${r}),D${r}*E${r},"")`,
    result: subtotal ?? "",
  };
  linha.getCell(7).value = item.origemPreco;

  linha.getCell(4).numFmt = formatoQuantidade(item.quantidade);
  linha.getCell(5).numFmt = FORMATO_MOEDA_XLSX;
  linha.getCell(6).numFmt = FORMATO_MOEDA_XLSX;

  // Preço unitário editável: aceita só números ≥ 0 (ou vazio).
  linha.getCell(5).dataValidation = {
    type: "decimal",
    operator: "greaterThanOrEqual",
    allowBlank: true,
    formulae: [0],
    showErrorMessage: true,
    errorTitle: "Preço inválido",
    error: "Informe um valor numérico maior ou igual a zero.",
  };

  COLUNAS.forEach((coluna, idx) => {
    const cell = linha.getCell(idx + 1);
    cell.border = bordasFinas(c);
    cell.alignment = { vertical: "middle", horizontal: coluna.alinhamento, wrapText: idx === 1 };
    if (pendente) cell.fill = preenchimento(c.alertaClaro);
  });

  if (item.codigoSinapi === null) {
    linha.getCell(1).font = { color: { argb: argb(c.textoApagado) } };
  }
  linha.getCell(7).font = { bold: true, color: { argb: argb(corOrigem(c, item.origemPreco)) } };
}

function escreverListaVazia(ws: ExcelJS.Worksheet, c: PaletaExportacao, r: number): void {
  ws.mergeCells(`A${r}:G${r}`);
  const cell = ws.getCell(`A${r}`);
  cell.value = "Nenhum item nesta lista.";
  cell.font = { italic: true, color: { argb: argb(c.textoSecundario) } };
  cell.alignment = { horizontal: "center" };
  cell.border = bordasFinas(c);
}

function escreverTotal(
  ws: ExcelJS.Worksheet,
  c: PaletaExportacao,
  r: number,
  ultimaLinhaItem: number,
  dados: ListaComprasExportacao,
): void {
  const pendentes = dados.itens.filter((i) => i.origemPreco === "PENDENTE").length;
  ws.mergeCells(`A${r}:E${r}`);

  const rotulo = ws.getCell(`A${r}`);
  rotulo.value = "Total Orçado";
  rotulo.alignment = { horizontal: "right", vertical: "middle" };

  const total = ws.getCell(`F${r}`);
  total.value = {
    formula: `SUM(F${PRIMEIRA_LINHA_ITEM}:F${ultimaLinhaItem})`,
    result: totalOrcado(dados.itens),
  };
  total.numFmt = FORMATO_MOEDA_XLSX;
  total.alignment = { horizontal: "right", vertical: "middle" };

  const observacao = ws.getCell(`G${r}`);
  observacao.value = pendentes > 0 ? `${pendentes} sem preço` : "";
  observacao.alignment = { horizontal: "center", vertical: "middle" };

  const bordaTopo: Partial<ExcelJS.Borders> = {
    top: { style: "medium", color: { argb: argb(c.destaque) } },
    bottom: bordaFina(c),
  };
  for (const col of ["A", "F", "G"]) {
    const cell = ws.getCell(`${col}${r}`);
    cell.fill = preenchimento(c.destaqueClaro);
    cell.border = bordaTopo;
    cell.font = { bold: true, size: 12, color: { argb: argb(c.destaque) } };
  }
  observacao.font = { bold: true, size: 10, color: { argb: argb(c.alerta) } };
  ws.getRow(r).height = 24;
}

function escreverLegenda(ws: ExcelJS.Worksheet, c: PaletaExportacao, r: number, temPendentes: boolean): void {
  ws.mergeCells(`A${r}:G${r}`);
  const cell = ws.getCell(`A${r}`);
  cell.value = temPendentes
    ? `Linhas ${c.nomeDestaquePendente}: itens sem preço definido (PENDENTE). Preencha o Preço Unitário e o Subtotal e o Total Orçado serão recalculados automaticamente.`
    : "Todos os itens possuem preço definido.";
  cell.font = { italic: true, size: 9, color: { argb: argb(c.textoSecundario) } };
  cell.alignment = { wrapText: true, vertical: "top" };
  ws.getRow(r).height = 30;
}

/** Gera o arquivo .xlsx da lista de compras (colorido por padrão). */
export async function gerarXlsxListaCompras(
  dados: ListaComprasExportacao,
  c: PaletaExportacao = PALETA_COLORIDA,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Build-Plan";
  wb.created = dados.emitidaEm;
  wb.title = `Lista de Compras — ${dados.etapaNome}`;
  wb.calcProperties.fullCalcOnLoad = true;

  const ws = wb.addWorksheet("Lista de Compras", {
    views: [{ state: "frozen", ySplit: LINHA_CABECALHO, showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: `${LINHA_CABECALHO}:${LINHA_CABECALHO}`,
    },
    headerFooter: { oddFooter: "&LBuild-Plan&RPágina &P de &N" },
  });

  calcularLarguras(dados.itens).forEach((largura, idx) => {
    ws.getColumn(idx + 1).width = largura;
  });

  escreverTitulo(ws, c);
  escreverInformacoes(ws, c, dados);
  escreverCabecalhoTabela(ws, c);

  dados.itens.forEach((item, idx) => escreverItem(ws, c, PRIMEIRA_LINHA_ITEM + idx, item));
  if (dados.itens.length === 0) escreverListaVazia(ws, c, PRIMEIRA_LINHA_ITEM);

  const ultimaLinhaItem = PRIMEIRA_LINHA_ITEM + Math.max(dados.itens.length, 1) - 1;
  if (dados.itens.length > 0) {
    ws.autoFilter = {
      from: { row: LINHA_CABECALHO, column: 1 },
      to: { row: ultimaLinhaItem, column: COLUNAS.length },
    };
  }

  const linhaTotal = ultimaLinhaItem + 1;
  escreverTotal(ws, c, linhaTotal, ultimaLinhaItem, dados);
  escreverLegenda(ws, c, linhaTotal + 2, dados.itens.some((i) => i.origemPreco === "PENDENTE"));

  return Buffer.from(await wb.xlsx.writeBuffer());
}
