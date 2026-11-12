// Caminho: /frontend/src/lib/sinapi.test.ts
// Referência regional do autocomplete SINAPI (defaults + override por env).

import { describe, it, expect } from "vitest";
import { resolverReferenciaSinapi } from "./sinapi";

describe("resolverReferenciaSinapi", () => {
  it("usa os defaults do backend (SC / NAO_DESONERADO) sem env", () => {
    expect(resolverReferenciaSinapi({})).toEqual({ uf: "SC", regime: "NAO_DESONERADO" });
  });

  it("aplica override normalizando caixa e espaços", () => {
    expect(resolverReferenciaSinapi({ VITE_SINAPI_UF: " pr ", VITE_SINAPI_REGIME: "desonerado" })).toEqual({
      uf: "PR",
      regime: "DESONERADO",
    });
  });

  it("ignora valores inválidos ou vazios", () => {
    expect(resolverReferenciaSinapi({ VITE_SINAPI_UF: "Santa Catarina", VITE_SINAPI_REGIME: "" })).toEqual({
      uf: "SC",
      regime: "NAO_DESONERADO",
    });
  });
});
