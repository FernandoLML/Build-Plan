// Caminho: /backend/src/services/export/lista-compras.pdf.ts
// Gera a lista de compras em PDF (pdfkit) para impressão e envio a
// fornecedores: cabeçalho com a logo, bloco de informações, resumo, tabela
// com quebra de página (cabeçalho repetido), itens PENDENTES em âmbar, linha
// de Total Orçado e rodapé "Página X de Y".

import PDFDocument from "pdfkit";
import { CORES, LOGO_PATHS } from "./marca.js";
import {
  formatarDataHora,
  formatarMoeda,
  formatarQuantidade,
  subtotalItem,
  totalOrcado,
  type ItemExportacao,
  type ListaComprasExportacao,
} from "./lista-compras.dados.js";

type Doc = PDFKit.PDFDocument;

const MARGEM = 36;
const LARGURA_PAGINA = 595.28; // A4
const ALTURA_PAGINA = 841.89;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const ESPACO_RODAPE = 28;
const LIMITE_INFERIOR = ALTURA_PAGINA - MARGEM - ESPACO_RODAPE;

const FONTE = "Helvetica";
const FONTE_NEGRITO = "Helvetica-Bold";
const TAMANHO_TABELA = 8.5;
const PADDING_CELULA = 4;
const ALTURA_MIN_LINHA = 18;

interface ColunaPdf {
  titulo: string;
  largura: number;
  alinhamento: "left" | "center" | "right";
}

// Soma = LARGURA_UTIL (523,28).
const COLUNAS_PDF: readonly ColunaPdf[] = [
  { titulo: "Cód. SINAPI", largura: 58, alinhamento: "center" },
  { titulo: "Descrição do Insumo", largura: 175.28, alinhamento: "left" },
  { titulo: "Unid.", largura: 40, alinhamento: "center" },
  { titulo: "Quantidade", largura: 55, alinhamento: "right" },
  { titulo: "Preço Unitário", largura: 68, alinhamento: "right" },
  { titulo: "Subtotal", largura: 72, alinhamento: "right" },
  { titulo: "Origem", largura: 55, alinhamento: "center" },
];

const COR_ORIGEM: Record<ItemExportacao["origemPreco"], string> = {
  SINAPI: CORES.indigo,
  MANUAL: CORES.ardosia600,
  PENDENTE: CORES.ambar800,
};

/** Logo: ícone "Boxes" em branco sobre quadrado índigo arredondado. */
function desenharLogo(doc: Doc, x: number, y: number, tamanho: number): void {
  doc.roundedRect(x, y, tamanho, tamanho, tamanho * 0.22).fill(CORES.indigo);

  const margemIcone = tamanho * 0.18;
  const escala = (tamanho - margemIcone * 2) / 24;
  doc.save();
  doc.translate(x + margemIcone, y + margemIcone).scale(escala);
  doc.lineWidth(2).lineCap("round").lineJoin("round").strokeColor("#FFFFFF");
  for (const d of LOGO_PATHS) {
    doc.path(d).stroke();
  }
  doc.restore();
}

function desenharCabecalho(doc: Doc, dados: ListaComprasExportacao): number {
  const topo = MARGEM;
  desenharLogo(doc, MARGEM, topo, 34);

  doc.font(FONTE_NEGRITO).fontSize(16).fillColor(CORES.ardosia900).text("Build-Plan", MARGEM + 44, topo + 3);
  doc.font(FONTE).fontSize(9).fillColor(CORES.ardosia600).text("Planejamento de suprimentos", MARGEM + 44, topo + 22);

  doc
    .font(FONTE_NEGRITO)
    .fontSize(14)
    .fillColor(CORES.indigo)
    .text("LISTA DE COMPRAS", MARGEM, topo + 3, { width: LARGURA_UTIL, align: "right" });
  doc
    .font(FONTE)
    .fontSize(9)
    .fillColor(CORES.ardosia600)
    .text(`Emitida em ${formatarDataHora(dados.emitidaEm)}`, MARGEM, topo + 22, {
      width: LARGURA_UTIL,
      align: "right",
    });

  const linha = topo + 46;
  doc.moveTo(MARGEM, linha).lineTo(MARGEM + LARGURA_UTIL, linha).lineWidth(1.5).strokeColor(CORES.indigo).stroke();
  return linha + 14;
}

function desenharInformacoes(doc: Doc, dados: ListaComprasExportacao, y: number): number {
  const campos: [string, string][] = [
    ["Obra", dados.obraNome],
    ["Etapa", dados.etapaNome],
    ["Lista gerada em", formatarDataHora(dados.geradaEm)],
  ];
  let atual = y;
  for (const [rotulo, valor] of campos) {
    doc.font(FONTE_NEGRITO).fontSize(9.5).fillColor(CORES.ardosia600).text(`${rotulo}:`, MARGEM, atual, { continued: true });
    doc.font(FONTE).fillColor(CORES.ardosia900).text(` ${valor}`, { width: LARGURA_UTIL });
    atual = doc.y + 3;
  }
  return atual + 8;
}

function desenharResumo(doc: Doc, dados: ListaComprasExportacao, y: number): number {
  const pendentes = dados.itens.filter((i) => i.origemPreco === "PENDENTE").length;
  const cartoes: { rotulo: string; valor: string; cor: string }[] = [
    { rotulo: "TOTAL DE ITENS", valor: String(dados.itens.length), cor: CORES.ardosia900 },
    { rotulo: "SEM PREÇO", valor: String(pendentes), cor: pendentes > 0 ? CORES.ambar800 : CORES.ardosia900 },
    { rotulo: "TOTAL ORÇADO", valor: formatarMoeda(totalOrcado(dados.itens)), cor: CORES.esmeralda700 },
  ];
  const espaco = 10;
  const largura = (LARGURA_UTIL - espaco * (cartoes.length - 1)) / cartoes.length;
  const altura = 44;

  cartoes.forEach((cartao, idx) => {
    const x = MARGEM + idx * (largura + espaco);
    doc.roundedRect(x, y, largura, altura, 6).fillAndStroke(CORES.ardosia50, CORES.ardosia200);
    doc.font(FONTE_NEGRITO).fontSize(7.5).fillColor(CORES.ardosia600).text(cartao.rotulo, x + 10, y + 9, { width: largura - 20 });
    doc.font(FONTE_NEGRITO).fontSize(14).fillColor(cartao.cor).text(cartao.valor, x + 10, y + 21, { width: largura - 20 });
  });
  return y + altura + 16;
}

function desenharCabecalhoTabela(doc: Doc, y: number): number {
  const altura = 22;
  doc.rect(MARGEM, y, LARGURA_UTIL, altura).fill(CORES.indigoClaro);
  let x = MARGEM;
  doc.font(FONTE_NEGRITO).fontSize(8).fillColor(CORES.ardosia900);
  for (const coluna of COLUNAS_PDF) {
    doc.text(coluna.titulo, x + PADDING_CELULA, y + 7, {
      width: coluna.largura - PADDING_CELULA * 2,
      align: coluna.alinhamento,
      lineBreak: false,
    });
    x += coluna.largura;
  }
  return y + altura;
}

function textosDaLinha(item: ItemExportacao): string[] {
  const subtotal = subtotalItem(item);
  return [
    item.codigoSinapi ?? "—",
    item.descricao,
    item.unidade,
    formatarQuantidade(item.quantidade),
    item.precoUnitario === null ? "—" : formatarMoeda(item.precoUnitario),
    subtotal === null ? "—" : formatarMoeda(subtotal),
    item.origemPreco,
  ];
}

function alturaDaLinha(doc: Doc, item: ItemExportacao): number {
  doc.font(FONTE).fontSize(TAMANHO_TABELA);
  const descricao = doc.heightOfString(item.descricao, { width: COLUNAS_PDF[1].largura - PADDING_CELULA * 2 });
  return Math.max(ALTURA_MIN_LINHA, descricao + PADDING_CELULA * 2 + 2);
}

function desenharLinha(doc: Doc, item: ItemExportacao, y: number, altura: number, zebra: boolean): void {
  if (item.origemPreco === "PENDENTE") {
    doc.rect(MARGEM, y, LARGURA_UTIL, altura).fill(CORES.ambarClaro);
  } else if (zebra) {
    doc.rect(MARGEM, y, LARGURA_UTIL, altura).fill(CORES.ardosia50);
  }

  const textos = textosDaLinha(item);
  let x = MARGEM;
  COLUNAS_PDF.forEach((coluna, idx) => {
    const ehOrigem = idx === COLUNAS_PDF.length - 1;
    const ehSubtotal = idx === 5;
    let cor: string = CORES.ardosia900;
    if (ehOrigem) cor = COR_ORIGEM[item.origemPreco];
    else if (textos[idx] === "—") cor = CORES.ardosia400;

    doc
      .font(ehOrigem || ehSubtotal ? FONTE_NEGRITO : FONTE)
      .fontSize(ehOrigem ? 7.5 : TAMANHO_TABELA)
      .fillColor(cor)
      .text(textos[idx], x + PADDING_CELULA, y + PADDING_CELULA + 1, {
        width: coluna.largura - PADDING_CELULA * 2,
        align: coluna.alinhamento,
        lineBreak: idx === 1,
      });
    x += coluna.largura;
  });

  doc
    .moveTo(MARGEM, y + altura)
    .lineTo(MARGEM + LARGURA_UTIL, y + altura)
    .lineWidth(0.5)
    .strokeColor(CORES.ardosia200)
    .stroke();
}

function desenharTotal(doc: Doc, dados: ListaComprasExportacao, y: number): number {
  const altura = 26;
  const pendentes = dados.itens.filter((i) => i.origemPreco === "PENDENTE").length;
  doc.rect(MARGEM, y, LARGURA_UTIL, altura).fill(CORES.indigoClaro);
  doc.moveTo(MARGEM, y).lineTo(MARGEM + LARGURA_UTIL, y).lineWidth(1.5).strokeColor(CORES.indigo).stroke();

  // Rótulo nas 4 primeiras colunas; valor ocupa Preço Unitário + Subtotal.
  const larguraRotulo = COLUNAS_PDF.slice(0, 4).reduce((acc, c) => acc + c.largura, 0);
  const larguraValor = COLUNAS_PDF[4].largura + COLUNAS_PDF[5].largura;
  const colunaObs = COLUNAS_PDF[6];

  doc.font(FONTE_NEGRITO).fontSize(10.5).fillColor(CORES.indigo);
  doc.text("Total Orçado", MARGEM, y + 8, { width: larguraRotulo - PADDING_CELULA, align: "right" });
  doc.text(formatarMoeda(totalOrcado(dados.itens)), MARGEM + larguraRotulo, y + 8, {
    width: larguraValor - PADDING_CELULA,
    align: "right",
    lineBreak: false,
  });
  if (pendentes > 0) {
    doc
      .font(FONTE_NEGRITO)
      .fontSize(7.5)
      .fillColor(CORES.ambar800)
      .text(`${pendentes} sem preço`, MARGEM + larguraRotulo + larguraValor, y + 10, {
        width: colunaObs.largura,
        align: "center",
        lineBreak: false,
      });
  }
  return y + altura + 12;
}

function desenharTabela(doc: Doc, dados: ListaComprasExportacao, inicio: number): number {
  let y = desenharCabecalhoTabela(doc, inicio);

  if (dados.itens.length === 0) {
    doc
      .font(FONTE)
      .fontSize(9)
      .fillColor(CORES.ardosia600)
      .text("Nenhum item nesta lista.", MARGEM, y + 8, { width: LARGURA_UTIL, align: "center" });
    y += 28;
  }

  dados.itens.forEach((item, idx) => {
    const altura = alturaDaLinha(doc, item);
    if (y + altura > LIMITE_INFERIOR) {
      doc.addPage();
      y = desenharCabecalhoTabela(doc, MARGEM);
    }
    desenharLinha(doc, item, y, altura, idx % 2 === 1);
    y += altura;
  });

  if (y + 26 > LIMITE_INFERIOR) {
    doc.addPage();
    y = MARGEM;
  }
  return desenharTotal(doc, dados, y);
}

function desenharLegenda(doc: Doc, dados: ListaComprasExportacao, y: number): void {
  if (!dados.itens.some((i) => i.origemPreco === "PENDENTE")) return;
  let topo = y;
  if (topo + 24 > LIMITE_INFERIOR) {
    doc.addPage();
    topo = MARGEM;
  }
  doc.rect(MARGEM, topo + 2, 9, 9).fill(CORES.ambarClaro);
  doc
    .font(FONTE)
    .fontSize(8)
    .fillColor(CORES.ardosia600)
    .text(
      "Itens destacados estão sem preço definido (PENDENTE) e não entram no Total Orçado. Informe a cotação no Build-Plan para completar o orçamento.",
      MARGEM + 14,
      topo + 2,
      { width: LARGURA_UTIL - 14 },
    );
}

function desenharRodapes(doc: Doc, dados: ListaComprasExportacao): void {
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    // Escrever abaixo da margem inferior criaria uma página nova: zera a margem.
    const margemOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = ALTURA_PAGINA - MARGEM - 10;
    doc.moveTo(MARGEM, y - 6).lineTo(MARGEM + LARGURA_UTIL, y - 6).lineWidth(0.5).strokeColor(CORES.ardosia200).stroke();
    doc
      .font(FONTE)
      .fontSize(7.5)
      .fillColor(CORES.ardosia400)
      .text(`Build-Plan · ${dados.obraNome} · ${dados.etapaNome}`, MARGEM, y, {
        width: LARGURA_UTIL * 0.75,
        lineBreak: false,
      });
    doc.text(`Página ${i - start + 1} de ${count}`, MARGEM, y, { width: LARGURA_UTIL, align: "right", lineBreak: false });
    doc.page.margins.bottom = margemOriginal;
  }
}

/** Gera o arquivo .pdf da lista de compras. */
export function gerarPdfListaCompras(dados: ListaComprasExportacao): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGEM,
    bufferPages: true,
    info: {
      Title: `Lista de Compras - ${dados.etapaNome}`,
      Author: "Build-Plan",
      Subject: `Obra: ${dados.obraNome}`,
      CreationDate: dados.emitidaEm,
    },
  });

  const partes: Buffer[] = [];
  const pronto = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (parte: Buffer) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);
  });

  let y = desenharCabecalho(doc, dados);
  y = desenharInformacoes(doc, dados, y);
  y = desenharResumo(doc, dados, y);
  y = desenharTabela(doc, dados, y);
  desenharLegenda(doc, dados, y);
  desenharRodapes(doc, dados);

  doc.end();
  return pronto;
}
