// Caminho: /backend/src/services/export/lista-compras.dados.spec.ts
// Testes unitários do modelo de exportação: normalização de itens, totais,
// slug do nome do arquivo e formatação pt-BR.

import { describe, it, expect } from "@jest/globals";
import {
  formatarDataHora,
  formatarMoeda,
  formatarQuantidade,
  nomeArquivoExportacao,
  paraItemExportacao,
  slugificar,
  subtotalItem,
  totalOrcado,
  type ItemCompraBruto,
  type ItemExportacao,
} from "./lista-compras.dados.js";

const codigos = new Map<string, string | null>([
  ["mat-1", "00001379"],
  ["mat-2", null],
]);

function bruto(overrides: Partial<ItemCompraBruto> = {}): ItemCompraBruto {
  return {
    materialId: "mat-1",
    descricao: "Cimento",
    unidade: "sc",
    quantidade: { toString: () => "10.000" },
    precoUnitario: { toString: () => "32.50" },
    origemPreco: "SINAPI",
    ...overrides,
  };
}

describe("paraItemExportacao", () => {
  it("converte decimais e resolve o código SINAPI pelo material", () => {
    expect(paraItemExportacao(bruto(), codigos)).toEqual({
      codigoSinapi: "00001379",
      descricao: "Cimento",
      unidade: "sc",
      quantidade: 10,
      precoUnitario: 32.5,
      origemPreco: "SINAPI",
    });
  });

  it("sem preço o item é PENDENTE, mesmo com outra origem gravada", () => {
    const item = paraItemExportacao(bruto({ precoUnitario: null, origemPreco: "MANUAL" }), codigos);
    expect(item.precoUnitario).toBeNull();
    expect(item.origemPreco).toBe("PENDENTE");
  });

  it("com preço e origem ausente/desconhecida, assume MANUAL", () => {
    expect(paraItemExportacao(bruto({ origemPreco: null }), codigos).origemPreco).toBe("MANUAL");
    expect(paraItemExportacao(bruto({ origemPreco: "PENDENTE" }), codigos).origemPreco).toBe("MANUAL");
  });

  it("código SINAPI é null sem material, com material sem código ou removido", () => {
    expect(paraItemExportacao(bruto({ materialId: null }), codigos).codigoSinapi).toBeNull();
    expect(paraItemExportacao(bruto({ materialId: "mat-2" }), codigos).codigoSinapi).toBeNull();
    expect(paraItemExportacao(bruto({ materialId: "removido" }), codigos).codigoSinapi).toBeNull();
  });
});

describe("subtotalItem / totalOrcado", () => {
  const itens: ItemExportacao[] = [
    { codigoSinapi: null, descricao: "A", unidade: "un", quantidade: 3, precoUnitario: 0.1, origemPreco: "MANUAL" },
    { codigoSinapi: null, descricao: "B", unidade: "un", quantidade: 2.5, precoUnitario: 4, origemPreco: "SINAPI" },
    { codigoSinapi: null, descricao: "C", unidade: "un", quantidade: 7, precoUnitario: null, origemPreco: "PENDENTE" },
  ];

  it("arredonda o subtotal a centavos e retorna null para pendentes", () => {
    expect(subtotalItem(itens[0])).toBe(0.3);
    expect(subtotalItem(itens[1])).toBe(10);
    expect(subtotalItem(itens[2])).toBeNull();
  });

  it("soma só os itens com preço, sem erro de ponto flutuante", () => {
    expect(totalOrcado(itens)).toBe(10.3);
    expect(totalOrcado([])).toBe(0);
  });
});

describe("slugificar / nomeArquivoExportacao", () => {
  it("remove acentos e símbolos", () => {
    expect(slugificar("Fundação & Estrutura")).toBe("fundacao-estrutura");
    expect(slugificar("  Acabamento (2º pavimento)  ")).toBe("acabamento-2-pavimento");
  });

  it("usa 'lista' quando não sobra nenhum caractere válido", () => {
    expect(slugificar("***")).toBe("lista");
  });

  it("monta o nome do arquivo com a extensão", () => {
    expect(nomeArquivoExportacao("Alvenaria", "xlsx")).toBe("lista-compras-alvenaria.xlsx");
    expect(nomeArquivoExportacao("Geral", "pdf")).toBe("lista-compras-geral.pdf");
    expect(nomeArquivoExportacao("Fundação", "pdf", "pb")).toBe("lista-compras-fundacao-pb.pdf");
    expect(nomeArquivoExportacao("Fundação", "xlsx", "cor")).toBe("lista-compras-fundacao.xlsx");
  });
});

describe("formatação pt-BR", () => {
  it("formata moeda sem NBSP, quantidade e data/hora de Brasília", () => {
    expect(formatarMoeda(1234.5)).toBe("R$ 1.234,50");
    expect(formatarQuantidade(1234.5)).toBe("1.234,5");
    expect(formatarDataHora(new Date("2026-11-14T18:30:00Z"))).toBe("14/11/2026 15:30");
  });
});
