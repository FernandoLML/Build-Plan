// Caminho: /frontend/src/test/setup.ts
// Setup global da suíte Vitest: matchers do jest-dom, limpeza de DOM,
// mocks e localStorage entre cada teste, e polyfills de jsdom exigidos
// pelos componentes Radix (shadcn/ui: Dialog, Select).

import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

// --- Polyfills de jsdom para os primitivos Radix (shadcn/ui) ---
// jsdom não implementa estas APIs; Dialog/Select as utilizam ao montar/abrir.

if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
window.ResizeObserver = ResizeObserverStub;

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}