// Caminho: /backend/src/services/export/lista-compras.pdf.spec.ts
// Testes unitários do gerador PDF: documento válido, metadados e paginação
// (listas longas quebram em várias páginas com rodapé "Página X de Y").

import { describe, it, expect } from "@jest/globals";
import { gerarPdfListaCompras } from "./lista-compras.pdf.js";
import { PALETA_PRETO_E_BRANCO } from "./marca.js";
import type { ItemExportacao, ListaComprasExportacao } from "./lista-compras.dados.js";

const item: ItemExportacao = {
  codigoSinapi: "00001379",
  descricao: "Cimento Portland composto CP II-32 (saco de 50 kg) com descricao longa para quebrar linha",
  unidade: "sc",
  quantidade: 12.5,
  precoUnitario: 36.9,
  origemPreco: "SINAPI",
};

function dados(itens: ItemExportacao[]): ListaComprasExportacao {
  return {
    obraNome: "Residencial Aurora",
    etapaNome: "Fundacao",
    geradaEm: new Date("2026-11-10T13:00:00Z"),
    emitidaEm: new Date("2026-11-14T18:30:00Z"),
    itens,
  };
}

function contarPaginas(pdf: Buffer): number {
  return pdf.toString("latin1").match(/\/Type \/Page\b/g)?.length ?? 0;
}

describe("gerarPdfListaCompras", () => {
  it("gera um PDF válido com título, autor e assunto", async () => {
    const pdf = await gerarPdfListaCompras(dados([item]));
    const texto = pdf.toString("latin1");

    expect(texto.startsWith("%PDF-")).toBe(true);
    expect(texto.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(texto).toContain("(Lista de Compras - Fundacao)");
    expect(texto).toContain("(Build-Plan)");
    expect(texto).toContain("(Obra: Residencial Aurora)");
    expect(contarPaginas(pdf)).toBe(1);
  });

  it("quebra listas longas em várias páginas", async () => {
    const pendente: ItemExportacao = { ...item, codigoSinapi: null, precoUnitario: null, origemPreco: "PENDENTE" };
    const muitos = Array.from({ length: 60 }, (_, i) => (i % 3 === 0 ? pendente : item));

    const pdf = await gerarPdfListaCompras(dados(muitos));

    expect(contarPaginas(pdf)).toBeGreaterThan(1);
  });

  it("gera a versão preto e branco com a mesma paginação", async () => {
    const pendente: ItemExportacao = { ...item, codigoSinapi: null, precoUnitario: null, origemPreco: "PENDENTE" };
    const lista = dados(Array.from({ length: 60 }, (_, i) => (i % 3 === 0 ? pendente : item)));

    const colorido = await gerarPdfListaCompras(lista);
    const pb = await gerarPdfListaCompras(lista, PALETA_PRETO_E_BRANCO);

    expect(pb.toString("latin1").startsWith("%PDF-")).toBe(true);
    expect(contarPaginas(pb)).toBe(contarPaginas(colorido));
    expect(pb.equals(colorido)).toBe(false);
  });

  it("gera o documento também para lista vazia", async () => {
    const pdf = await gerarPdfListaCompras(dados([]));

    expect(pdf.toString("latin1").startsWith("%PDF-")).toBe(true);
    expect(contarPaginas(pdf)).toBe(1);
  });
});
