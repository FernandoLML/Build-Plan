// Caminho: /backend/src/services/export/marca.spec.ts
// Paletas dos documentos exportados: a preto e branco só pode ter cinzas.

import { describe, it, expect } from "@jest/globals";
import {
  PALETA_COLORIDA,
  PALETA_PRETO_E_BRANCO,
  argb,
  paletaDoTema,
  type PaletaExportacao,
} from "./marca.js";

const cores = (paleta: PaletaExportacao) =>
  Object.entries(paleta).filter(([papel]) => papel !== "nomeDestaquePendente") as [string, string][];

describe("paletas de exportação", () => {
  it("a paleta preto e branco usa apenas tons de cinza (R = G = B)", () => {
    for (const [papel, hex] of cores(PALETA_PRETO_E_BRANCO)) {
      const [r, g, b] = [1, 3, 5].map((i) => hex.slice(i, i + 2));
      expect({ papel, r, g }).toEqual({ papel, r: b, g: b });
    }
  });

  it("na P&B o texto é preto e o destaque dos pendentes é mais escuro que a zebra", () => {
    expect(PALETA_PRETO_E_BRANCO.texto).toBe("#000000");
    const nivel = (hex: string) => Number.parseInt(hex.slice(1, 3), 16);
    expect(nivel(PALETA_PRETO_E_BRANCO.alertaClaro)).toBeLessThan(nivel(PALETA_PRETO_E_BRANCO.fundoAlternado));
  });

  it("as duas paletas definem os mesmos papéis", () => {
    expect(Object.keys(PALETA_PRETO_E_BRANCO).sort()).toEqual(Object.keys(PALETA_COLORIDA).sort());
  });

  it("escolhe a paleta pelo tema", () => {
    expect(paletaDoTema("cor")).toBe(PALETA_COLORIDA);
    expect(paletaDoTema("pb")).toBe(PALETA_PRETO_E_BRANCO);
  });

  it("converte #RRGGBB para o ARGB do exceljs", () => {
    expect(argb("#4f46e5")).toBe("FF4F46E5");
  });
});
