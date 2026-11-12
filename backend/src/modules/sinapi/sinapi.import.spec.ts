// Caminho: /backend/src/modules/sinapi/sinapi.import.spec.ts
// Testes unitários das regras puras do importador SINAPI (fonte, competência
// e schema dos registros). Não dependem de banco.

import { describe, it, expect } from "@jest/globals";
import {
  competenciaDoLote,
  registroSinapiSchema,
  resolverCompetencia,
  resolverFonteSinapi,
} from "./sinapi.import.js";

const PADRAO = "/app/prisma/seed/sinapi.sample.json";
const PLANILHA = "prisma/seed/sinapi/SINAPI 202609 SC.xlsx";

describe("resolverFonteSinapi", () => {
  it("usa SINAPI_SOURCE quando preenchida (com trim)", () => {
    expect(resolverFonteSinapi({ SINAPI_SOURCE: "  fonte.json " }, PADRAO)).toBe("fonte.json");
  });

  it.each([
    ["ausente", undefined],
    ["vazia (input opcional do workflow)", ""],
    ["só espaços", "   "],
  ])("cai no caminho padrão quando SINAPI_SOURCE está %s", (_desc, valor) => {
    expect(resolverFonteSinapi({ SINAPI_SOURCE: valor }, PADRAO)).toBe(PADRAO);
  });
});

describe("resolverCompetencia", () => {
  it("deriva UF, mês e ano do nome do arquivo, com regime padrão", () => {
    expect(resolverCompetencia(PLANILHA, {})).toEqual({
      uf: "SC",
      mesReferencia: 9,
      anoReferencia: 2026,
      regime: "NAO_DESONERADO",
    });
  });

  it("aplica overrides de env (UF em minúsculas e regime normalizados)", () => {
    const comp = resolverCompetencia(PLANILHA, {
      SINAPI_UF: "pr",
      SINAPI_MES: "3",
      SINAPI_ANO: "2025",
      SINAPI_REGIME: "desonerado",
    });
    expect(comp).toEqual({ uf: "PR", mesReferencia: 3, anoReferencia: 2025, regime: "DESONERADO" });
  });

  it("ignora envs vazias e usa os valores do nome do arquivo", () => {
    const comp = resolverCompetencia(PLANILHA, {
      SINAPI_UF: "",
      SINAPI_MES: " ",
      SINAPI_ANO: "",
      SINAPI_REGIME: "",
    });
    expect(comp).toMatchObject({ uf: "SC", mesReferencia: 9, anoReferencia: 2026, regime: "NAO_DESONERADO" });
  });

  it.each(["0", "13", "-1", "1.5", "abc"])("rejeita mês fora de 1–12 ou inválido (%s)", (mes) => {
    expect(() => resolverCompetencia(PLANILHA, { SINAPI_MES: mes })).toThrow(/mesReferencia/);
  });

  it("rejeita mês inválido vindo do nome do arquivo (ex.: 202613)", () => {
    expect(() => resolverCompetencia("SINAPI 202613 SC.xlsx", {})).toThrow(/mesReferencia/);
  });

  it("rejeita regime fora do enum (sem cast inseguro)", () => {
    expect(() => resolverCompetencia(PLANILHA, { SINAPI_REGIME: "ONERADO" })).toThrow(/regime/);
  });

  it("exige a competência quando não há YYYYMM no nome nem env", () => {
    expect(() => resolverCompetencia("catalogo.xlsx", {})).toThrow(/Competência indefinida/);
  });
});

describe("registroSinapiSchema", () => {
  const base = {
    codigo: "00000370",
    descricao: "AREIA MEDIA",
    unidade: "M3",
    precoMediano: "32.5",
    uf: "sc",
    mesReferencia: 9,
    anoReferencia: 2026,
  };

  it("aplica defaults e normaliza UF", () => {
    const r = registroSinapiSchema.parse(base);
    expect(r).toMatchObject({ uf: "SC", precoMediano: 32.5, regime: "NAO_DESONERADO", tipo: "INSUMO" });
  });

  it("rejeita mês 13 e regime desconhecido", () => {
    expect(registroSinapiSchema.safeParse({ ...base, mesReferencia: 13 }).success).toBe(false);
    expect(registroSinapiSchema.safeParse({ ...base, regime: "X" }).success).toBe(false);
  });
});

describe("competenciaDoLote", () => {
  const sc = { uf: "SC", mesReferencia: 9, anoReferencia: 2026, regime: "NAO_DESONERADO" as const };

  it("retorna a competência compartilhada pelo lote", () => {
    expect(competenciaDoLote([sc, { ...sc }])).toEqual(sc);
  });

  it("rejeita lote com competências misturadas", () => {
    expect(() => competenciaDoLote([sc, { ...sc, mesReferencia: 10 }])).toThrow(/mistura competências/);
  });

  it("rejeita lote vazio", () => {
    expect(() => competenciaDoLote([])).toThrow(/Lote vazio/);
  });
});
