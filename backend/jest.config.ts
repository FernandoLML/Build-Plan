// Caminho: /backend/jest.config.ts
// Configuração do Jest para TypeScript em ESM.
// Roda com NODE_OPTIONS=--experimental-vm-modules (ver scripts do package.json).

import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  // Trata .ts como ESM
  extensionsToTreatAsEsm: [".ts"],

  // Resolve os imports internos escritos com ".js" (padrão NodeNext) para o .ts real.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // Apenas arquivos de teste
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],

  // Limpa e prepara o banco entre os testes
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],

  // Testes de integração tocam o banco — execute em série para evitar corrida.
  maxWorkers: 1,
  clearMocks: true,
  testTimeout: 20000,
};

export default config;