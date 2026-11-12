// Caminho: /frontend/src/lib/tarefas.test.ts
// Regras puras: progresso físico (incluindo etapa vazia) e conversão de datas.

import { describe, it, expect } from "vitest";
import { calcularProgresso, dataInputParaIso, isoParaDataInput } from "./tarefas";
import type { StatusTarefa } from "@/types/tarefa";

const comStatus = (...status: StatusTarefa[]) => status.map((s) => ({ status: s }));

describe("calcularProgresso", () => {
  it("retorna 0% para etapa sem tarefas (sem divisão por zero)", () => {
    const p = calcularProgresso([]);
    expect(p).toEqual({ total: 0, concluidas: 0, percentual: 0 });
    expect(Number.isNaN(p.percentual)).toBe(false);
  });

  it("conta apenas CONCLUIDA como avanço físico", () => {
    expect(calcularProgresso(comStatus("PENDENTE", "EM_ANDAMENTO", "BLOQUEADA", "CONCLUIDA"))).toEqual({
      total: 4,
      concluidas: 1,
      percentual: 25,
    });
  });

  it("arredonda o percentual para inteiro (mesma regra do backend)", () => {
    expect(calcularProgresso(comStatus("CONCLUIDA", "PENDENTE", "PENDENTE")).percentual).toBe(33);
    expect(calcularProgresso(comStatus("CONCLUIDA", "CONCLUIDA", "PENDENTE")).percentual).toBe(67);
  });

  it("retorna 100% quando todas as tarefas estão concluídas", () => {
    expect(calcularProgresso(comStatus("CONCLUIDA", "CONCLUIDA")).percentual).toBe(100);
  });
});

describe("conversão de datas", () => {
  it("converte valor de input date em ISO ao meio-dia UTC", () => {
    expect(dataInputParaIso("2026-09-07")).toBe("2026-09-07T12:00:00.000Z");
  });

  it("retorna undefined para valor vazio/ausente", () => {
    expect(dataInputParaIso("")).toBeUndefined();
    expect(dataInputParaIso(undefined)).toBeUndefined();
    expect(dataInputParaIso(null)).toBeUndefined();
  });

  it("converte ISO da API para o formato do input date", () => {
    expect(isoParaDataInput("2026-09-07T12:00:00.000Z")).toBe("2026-09-07");
    expect(isoParaDataInput(null)).toBe("");
    expect(isoParaDataInput(undefined)).toBe("");
  });
});
