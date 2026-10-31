// Caminho: /frontend/src/test/setup.ts
// Setup global da suíte Vitest: matchers do jest-dom, limpeza de DOM,
// mocks e localStorage entre cada teste.

import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});