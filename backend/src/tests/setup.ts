// Caminho: /backend/src/tests/setup.ts
// Executado antes de cada arquivo de teste (setupFilesAfterEnv).
// Garante banco limpo antes de cada teste e desconecta ao final.

import { beforeEach, afterAll } from "@jest/globals";
import { resetDatabase, disconnect, garantirBancoDeTeste } from "./helpers/test-db.js";

// Falha o arquivo inteiro antes de qualquer limpeza se o banco não for de teste.
garantirBancoDeTeste();

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnect();
});