// Caminho: /frontend/src/lib/suprimentos.test.ts
// Regras puras do Dashboard: progresso de suprimentos por etapa e etapa em execução.

import { describe, it, expect } from "vitest";
import { calcularProgressoSuprimentos, encontrarEtapaEmExecucao } from "./suprimentos";
import type { StatusVinculo } from "@/types/material";

const v = (etapaId: string, status: StatusVinculo) => ({ etapaId, status });

describe("calcularProgressoSuprimentos", () => {
  it("retorna 0% para etapa sem vínculos (sem divisão por zero)", () => {
    expect(calcularProgressoSuprimentos([v("outra", "APLICADO")], "e1")).toEqual({
      total: 0,
      aplicados: 0,
      percentual: 0,
    });
  });

  it("conta apenas APLICADO como avanço e considera só a etapa informada", () => {
    const vinculos = [v("e1", "PREVISTO"), v("e1", "RECEBIDO"), v("e1", "APLICADO"), v("e2", "APLICADO")];
    expect(calcularProgressoSuprimentos(vinculos, "e1")).toEqual({ total: 3, aplicados: 1, percentual: 33 });
    expect(calcularProgressoSuprimentos(vinculos, "e2")).toEqual({ total: 1, aplicados: 1, percentual: 100 });
  });

  it("arredonda o percentual para inteiro", () => {
    const vinculos = [v("e1", "APLICADO"), v("e1", "APLICADO"), v("e1", "PREVISTO")];
    expect(calcularProgressoSuprimentos(vinculos, "e1").percentual).toBe(67);
  });
});

describe("encontrarEtapaEmExecucao", () => {
  const etapas = [
    { id: "e3", ordem: 3 },
    { id: "e1", ordem: 1 },
    { id: "e2", ordem: 2 },
  ];

  it("escolhe a primeira etapa (pela ordem) com progresso parcial", () => {
    const vinculos = [
      v("e1", "APLICADO"), // e1 = 100% → concluída, não está "em execução"
      v("e2", "APLICADO"),
      v("e2", "PREVISTO"), // e2 = 50%
      v("e3", "APLICADO"),
      v("e3", "RECEBIDO"), // e3 = 50%, mas vem depois de e2
    ];
    expect(encontrarEtapaEmExecucao(etapas, vinculos)?.id).toBe("e2");
  });

  it("cai na primeira etapa pela ordem quando nenhuma está parcial", () => {
    expect(encontrarEtapaEmExecucao(etapas, [v("e2", "PREVISTO")])?.id).toBe("e1");
  });

  it("retorna null sem etapas", () => {
    expect(encontrarEtapaEmExecucao([], [])).toBeNull();
  });
});
