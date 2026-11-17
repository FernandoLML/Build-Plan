// Caminho: /backend/src/services/export/lista-compras.xlsx.spec.ts
// Testes unitários do gerador .xlsx: o buffer é relido com o próprio exceljs
// para validar cabeçalho, colunas, formatos, fórmulas e destaque de pendentes.

import { describe, it, expect } from "@jest/globals";
import ExcelJS from "exceljs";
import {
  COLUNAS,
  FORMATO_MOEDA_XLSX,
  LINHA_CABECALHO,
  PRIMEIRA_LINHA_ITEM,
  calcularLarguras,
  gerarXlsxListaCompras,
} from "./lista-compras.xlsx.js";
import { PALETA_COLORIDA, PALETA_PRETO_E_BRANCO, argb } from "./marca.js";
import type { ItemExportacao, ListaComprasExportacao } from "./lista-compras.dados.js";

const itens: ItemExportacao[] = [
  { codigoSinapi: "00001379", descricao: "Cimento CP II-32", unidade: "sc", quantidade: 10, precoUnitario: 32.5, origemPreco: "SINAPI" },
  { codigoSinapi: null, descricao: "Brita 1", unidade: "m3", quantidade: 2.5, precoUnitario: null, origemPreco: "PENDENTE" },
  { codigoSinapi: null, descricao: "Vergalhão CA-50", unidade: "kg", quantidade: 100, precoUnitario: 8.75, origemPreco: "MANUAL" },
];

function dados(overrides: Partial<ListaComprasExportacao> = {}): ListaComprasExportacao {
  return {
    obraNome: "Residencial Aurora",
    etapaNome: "Fundação",
    geradaEm: new Date("2026-11-10T13:00:00Z"),
    emitidaEm: new Date("2026-11-14T18:30:00Z"),
    itens,
    ...overrides,
  };
}

async function abrir(d: ListaComprasExportacao, paleta = PALETA_COLORIDA): Promise<ExcelJS.Worksheet> {
  const buffer = await gerarXlsxListaCompras(d, paleta);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.getWorksheet("Lista de Compras");
  if (!ws) throw new Error("planilha não encontrada");
  return ws;
}

function corDeFundo(cell: ExcelJS.Cell): string | undefined {
  const fill = cell.fill as ExcelJS.FillPattern | undefined;
  return fill?.fgColor?.argb;
}

describe("gerarXlsxListaCompras", () => {
  it("gera um arquivo .xlsx válido (zip OOXML)", async () => {
    const buffer = await gerarXlsxListaCompras(dados());
    expect(buffer.subarray(0, 2).toString()).toBe("PK");
  });

  it("escreve o cabeçalho informativo com obra, etapa e datas", async () => {
    const ws = await abrir(dados());

    expect(ws.getCell("A1").value).toBe("Build-Plan  ·  Lista de Compras");
    expect(ws.getCell("B3").value).toBe("Residencial Aurora");
    expect(ws.getCell("B4").value).toBe("Fundação");
    expect(ws.getCell("F3").value).toBe("14/11/2026 15:30");
    expect(ws.getCell("F4").value).toBe("10/11/2026 10:00");
    expect(ws.getCell("B5").value).toBe(3);
    expect(ws.getCell("F5").value).toBe(1);
  });

  it("monta o cabeçalho da tabela em negrito, com fundo e bordas finas", async () => {
    const ws = await abrir(dados());
    const linha = ws.getRow(LINHA_CABECALHO);

    expect(COLUNAS.map((_, i) => linha.getCell(i + 1).value)).toEqual([
      "Código SINAPI",
      "Descrição do Insumo",
      "Unidade",
      "Quantidade",
      "Preço Unitário",
      "Subtotal",
      "Origem do Preço",
    ]);
    const cell = linha.getCell(1);
    expect(cell.font?.bold).toBe(true);
    expect(corDeFundo(cell)).toBe(argb(PALETA_COLORIDA.destaqueClaro));
    expect(cell.border?.top?.style).toBe("thin");
  });

  it("preenche os itens com formato monetário e subtotal por fórmula", async () => {
    const ws = await abrir(dados());
    const r = PRIMEIRA_LINHA_ITEM;
    const linha = ws.getRow(r);

    expect(linha.getCell(1).value).toBe("00001379");
    expect(linha.getCell(4).value).toBe(10);
    expect(linha.getCell(5).value).toBe(32.5);
    expect(linha.getCell(5).numFmt).toBe(FORMATO_MOEDA_XLSX);
    expect(linha.getCell(6).numFmt).toBe(FORMATO_MOEDA_XLSX);
    expect(linha.getCell(6).value).toMatchObject({ formula: `IF(ISNUMBER(E${r}),D${r}*E${r},"")`, result: 325 });
    expect(linha.getCell(7).value).toBe("SINAPI");
    // Quantidade fracionária ganha 3 casas; inteira, nenhuma.
    expect(linha.getCell(4).numFmt).toBe("#,##0");
    expect(ws.getRow(r + 1).getCell(4).numFmt).toBe("#,##0.000");
  });

  it("destaca em âmbar as linhas PENDENTE e deixa o preço em branco para edição", async () => {
    const ws = await abrir(dados());
    const pendente = ws.getRow(PRIMEIRA_LINHA_ITEM + 1);
    const cotado = ws.getRow(PRIMEIRA_LINHA_ITEM + 2);

    for (let c = 1; c <= COLUNAS.length; c++) {
      expect(corDeFundo(pendente.getCell(c))).toBe(argb(PALETA_COLORIDA.alertaClaro));
      expect(corDeFundo(cotado.getCell(c))).toBeUndefined();
    }
    expect(pendente.getCell(1).value).toBe("—");
    expect(pendente.getCell(5).value).toBeNull();
    expect(pendente.getCell(7).value).toBe("PENDENTE");
    expect(pendente.getCell(5).dataValidation).toMatchObject({ type: "decimal", operator: "greaterThanOrEqual" });
  });

  it("fecha com a linha de Total Orçado usando SUM sobre os subtotais", async () => {
    const ws = await abrir(dados());
    const r = PRIMEIRA_LINHA_ITEM + itens.length;

    expect(ws.getCell(`A${r}`).value).toBe("Total Orçado");
    expect(ws.getCell(`F${r}`).value).toMatchObject({
      formula: `SUM(F${PRIMEIRA_LINHA_ITEM}:F${r - 1})`,
      result: 1200, // 325 + 875 (pendente fica de fora)
    });
    expect(ws.getCell(`F${r}`).numFmt).toBe(FORMATO_MOEDA_XLSX);
    expect(ws.getCell(`G${r}`).value).toBe("1 sem preço");
    expect(String(ws.getCell(`A${r + 2}`).value)).toContain("Linhas em amarelo");
  });

  it("congela o cabeçalho e aplica autofiltro na tabela", async () => {
    const ws = await abrir(dados());

    expect(ws.views[0]).toMatchObject({ state: "frozen", ySplit: LINHA_CABECALHO });
    expect(ws.autoFilter).toBeDefined();
  });

  it("lista vazia: mensagem no lugar dos itens e total 0 por fórmula", async () => {
    const ws = await abrir(dados({ itens: [], etapaNome: "Geral" }));
    const r = PRIMEIRA_LINHA_ITEM;

    expect(ws.getCell(`A${r}`).value).toBe("Nenhum item nesta lista.");
    // O exceljs não grava resultado em cache igual a 0; o Excel recalcula ao abrir.
    expect(ws.getCell(`F${r + 1}`).value).toMatchObject({ formula: `SUM(F${r}:F${r})` });
    expect(ws.getCell(`G${r + 1}`).value).toBe("");
    expect(ws.getCell(`A${r + 3}`).value).toBe("Todos os itens possuem preço definido.");
  });
});

describe("gerarXlsxListaCompras — versão preto e branco", () => {
  it("troca as cores da marca por cinzas e ajusta a legenda", async () => {
    const ws = await abrir(dados(), PALETA_PRETO_E_BRANCO);
    const pendente = ws.getRow(PRIMEIRA_LINHA_ITEM + 1);
    const r = PRIMEIRA_LINHA_ITEM + itens.length;

    expect(corDeFundo(ws.getCell("A1"))).toBe(argb(PALETA_PRETO_E_BRANCO.destaque));
    expect(corDeFundo(ws.getRow(LINHA_CABECALHO).getCell(1))).toBe(argb(PALETA_PRETO_E_BRANCO.destaqueClaro));
    expect(corDeFundo(pendente.getCell(1))).toBe(argb(PALETA_PRETO_E_BRANCO.alertaClaro));
    expect(String(ws.getCell(`A${r + 2}`).value)).toContain("Linhas em cinza");
  });

  it("mantém os mesmos dados e fórmulas da versão colorida", async () => {
    const colorida = await abrir(dados());
    const pb = await abrir(dados(), PALETA_PRETO_E_BRANCO);
    const r = PRIMEIRA_LINHA_ITEM + itens.length;

    expect(pb.getCell(`F${r}`).value).toEqual(colorida.getCell(`F${r}`).value);
    expect(pb.getRow(PRIMEIRA_LINHA_ITEM).values).toEqual(colorida.getRow(PRIMEIRA_LINHA_ITEM).values);
  });
});

describe("calcularLarguras", () => {
  it("usa os mínimos com textos curtos e limita descrições longas", () => {
    const longa: ItemExportacao = { ...itens[0], descricao: "x".repeat(200) };

    expect(calcularLarguras([])).toEqual(COLUNAS.map((c) => Math.max(c.min, c.titulo.length + 2)));
    expect(calcularLarguras([longa])[1]).toBe(COLUNAS[1].max);
  });
});
