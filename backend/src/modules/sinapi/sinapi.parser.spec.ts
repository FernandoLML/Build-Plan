// Caminho: /backend/src/modules/sinapi/sinapi.parser.spec.ts
// Teste unitário do parser da planilha SINAPI. Usa a planilha oficial de SC
// (202609) como fixture versionada em prisma/seed/sinapi/. Não depende de banco.

import { describe, it, expect } from "@jest/globals";
import { resolve } from "node:path";
import { parsePlanilhaSinapi } from "./sinapi.parser.js";

// Jest roda a partir da raiz do backend (cwd), onde fica a pasta prisma/.
const PLANILHA = resolve(process.cwd(), "prisma/seed/sinapi/SINAPI 202609 SC.xlsx");

const OPCOES = {
  uf: "SC",
  mesReferencia: 9,
  anoReferencia: 2026,
  regime: "NAO_DESONERADO" as const,
};

describe("parsePlanilhaSinapi", () => {
  it("extrai exatamente os insumos com preço mediano válido para SC", () => {
    const registros = parsePlanilhaSinapi(PLANILHA, OPCOES);
    // Inspeção oficial: 4.878 insumos no total, 4.135 com preço SC válido.
    expect(registros).toHaveLength(4135);
  });

  it("normaliza os campos e a competência em todos os registros", () => {
    const registros = parsePlanilhaSinapi(PLANILHA, OPCOES);

    for (const r of registros) {
      expect(r.codigo).toBeTruthy();
      expect(r.descricao.length).toBeGreaterThan(0);
      expect(r.unidade.length).toBeGreaterThan(0);
      expect(typeof r.precoMediano).toBe("number");
      expect(r.precoMediano).toBeGreaterThan(0);
      expect(r.uf).toBe("SC");
      expect(r.mesReferencia).toBe(9);
      expect(r.anoReferencia).toBe(2026);
      expect(r.regime).toBe("NAO_DESONERADO");
      expect(r.tipo).toBe("INSUMO");
    }
  });

  it("encontra um insumo conhecido (areia média) com preço positivo", () => {
    const registros = parsePlanilhaSinapi(PLANILHA, OPCOES);
    const areia = registros.find((r) => /AREIA MEDIA/.test(r.descricao));
    expect(areia).toBeDefined();
    expect(areia!.precoMediano).toBeGreaterThan(0);
    expect(areia!.unidade).toBe("M3");
  });

  it("lança erro quando a aba não existe", () => {
    expect(() => parsePlanilhaSinapi(PLANILHA, { ...OPCOES, aba: "INEXISTENTE" })).toThrow(
      /Aba .* não encontrada/,
    );
  });

  it("lança erro quando a UF não é encontrada no cabeçalho", () => {
    expect(() => parsePlanilhaSinapi(PLANILHA, { ...OPCOES, uf: "ZZ" })).toThrow(
      /Colunas não localizadas/,
    );
  });
});