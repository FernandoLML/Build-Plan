// Caminho: /backend/src/tests/test-db-guard.spec.ts
// A trava que impede a suíte de apagar um banco que não seja de teste.

import { describe, it, expect } from "@jest/globals";
import { garantirBancoDeTeste } from "./helpers/test-db.js";

describe("garantirBancoDeTeste", () => {
  it("aceita banco ou schema de teste", () => {
    expect(() => garantirBancoDeTeste("postgresql://u:p@localhost:5432/buildplan_db?schema=test_buildplan")).not.toThrow();
    expect(() => garantirBancoDeTeste("postgresql://u:p@localhost:5432/buildplan_test?schema=public")).not.toThrow();
  });

  it("recusa o banco de desenvolvimento, URL ausente ou inválida", () => {
    expect(() => garantirBancoDeTeste("postgresql://u:p@localhost:5432/buildplan_db?schema=public")).toThrow(/abortados/);
    expect(() => garantirBancoDeTeste("")).toThrow(/abortados/);
    expect(() => garantirBancoDeTeste("nao-e-url")).toThrow(/abortados/);
  });
});
