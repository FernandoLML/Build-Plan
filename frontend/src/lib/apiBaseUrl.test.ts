// Caminho: /frontend/src/lib/apiBaseUrl.test.ts

import { describe, it, expect, vi, afterEach } from "vitest";
import { API_LOCAL, resolverApiBaseUrl } from "./apiBaseUrl";

describe("resolverApiBaseUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa a API local em desenvolvimento quando a variável não existe", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(resolverApiBaseUrl({})).toBe(API_LOCAL);
    expect(resolverApiBaseUrl({ VITE_API_URL: "   " })).toBe(API_LOCAL);
    expect(erro).not.toHaveBeenCalled();
  });

  it("usa a URL informada, sem espaços nem barra no final", () => {
    expect(resolverApiBaseUrl({ VITE_API_URL: " https://api.exemplo.com/api/ ", PROD: true })).toBe(
      "https://api.exemplo.com/api",
    );
  });

  it("avisa quando o build de produção fica sem a variável", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(resolverApiBaseUrl({ PROD: true })).toBe(API_LOCAL);
    expect(erro).toHaveBeenCalledWith(expect.stringContaining("VITE_API_URL não foi definida"));
  });

  it("avisa quando a API de produção não usa https", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(resolverApiBaseUrl({ VITE_API_URL: "http://1.2.3.4/api", PROD: true })).toBe("http://1.2.3.4/api");
    expect(erro).toHaveBeenCalledWith(expect.stringContaining("https://"));
  });
});
