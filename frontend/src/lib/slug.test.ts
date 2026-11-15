// Caminho: /frontend/src/lib/slug.test.ts

import { describe, it, expect } from "vitest";
import { nomeArquivoListaCompras, slugificar } from "./slug";

describe("slugificar", () => {
  it("remove acentos, símbolos e hífens nas pontas", () => {
    expect(slugificar("Fundação & Estrutura")).toBe("fundacao-estrutura");
    expect(slugificar("  -Alvenaria- ")).toBe("alvenaria");
  });

  it("usa 'lista' quando não sobra caractere válido", () => {
    expect(slugificar("***")).toBe("lista");
  });
});

describe("nomeArquivoListaCompras", () => {
  it("monta lista-compras-<etapa>.<extensao>", () => {
    expect(nomeArquivoListaCompras("Fundação", "xlsx")).toBe("lista-compras-fundacao.xlsx");
    expect(nomeArquivoListaCompras("Geral", "pdf")).toBe("lista-compras-geral.pdf");
  });
});
