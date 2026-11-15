// Caminho: /backend/src/config/env.spec.ts
// Validação das variáveis de ambiente: regras gerais e as extras de produção.

import { describe, it, expect, jest, afterEach } from "@jest/globals";
import { carregarEnv, validarEnv } from "./env.js";

const SEGREDO_FORTE = "k3J9xQ2mZ7pL5vN8wR4tY6uB1cD0fGhA";

const DEV = {
  DATABASE_URL: "postgresql://buildplan:senha-local@localhost:5432/buildplan_db?schema=public",
  JWT_SECRET: "segredo-de-desenvolvimento",
};

const PROD = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://buildplan:9f8e7d6c5b4a39281706@postgres:5432/buildplan?schema=public",
  JWT_SECRET: SEGREDO_FORTE,
  CORS_ORIGINS: "https://build-plan.vercel.app",
};

function erros(origem: Record<string, string | undefined>): Record<string, string[]> {
  const resultado = validarEnv(origem);
  if (resultado.sucesso) throw new Error("esperava ambiente inválido");
  return resultado.erros;
}

function valido(origem: Record<string, string | undefined>) {
  const resultado = validarEnv(origem);
  if (!resultado.sucesso) throw new Error(`esperava ambiente válido: ${JSON.stringify(resultado.erros)}`);
  return resultado.env;
}

describe("validarEnv — regras gerais", () => {
  it("aplica os defaults de desenvolvimento", () => {
    expect(valido(DEV)).toMatchObject({
      NODE_ENV: "development",
      PORT: 3333,
      JWT_EXPIRES_IN: "8h",
      CORS_ORIGINS: ["http://localhost:5173"],
      TRUST_PROXY: 0,
    });
  });

  it("exige DATABASE_URL e JWT_SECRET", () => {
    const e = erros({});
    expect(e.DATABASE_URL).toEqual(["DATABASE_URL é obrigatória."]);
    expect(e.JWT_SECRET).toEqual(["JWT_SECRET é obrigatória."]);
  });

  it("recusa DATABASE_URL que não seja postgresql://", () => {
    expect(erros({ ...DEV, DATABASE_URL: "mysql://u:p@localhost/db" }).DATABASE_URL).toBeDefined();
    expect(erros({ ...DEV, DATABASE_URL: "nao-e-url" }).DATABASE_URL).toBeDefined();
    expect(valido({ ...DEV, DATABASE_URL: "postgres://u:p@localhost/db" }).DATABASE_URL).toContain("postgres://");
  });

  it("recusa JWT_SECRET curto", () => {
    expect(erros({ ...DEV, JWT_SECRET: "curto" }).JWT_SECRET[0]).toContain("ao menos 16");
  });

  it("separa as origens do CORS por vírgula e recusa '*' ou origem malformada", () => {
    expect(valido({ ...DEV, CORS_ORIGINS: " http://localhost:5173 , https://app.exemplo.com ,," }).CORS_ORIGINS).toEqual([
      "http://localhost:5173",
      "https://app.exemplo.com",
    ]);
    expect(erros({ ...DEV, CORS_ORIGINS: "*" }).CORS_ORIGINS[0]).toContain('"*"');
    expect(erros({ ...DEV, CORS_ORIGINS: "https://app.exemplo.com/" }).CORS_ORIGINS[0]).toContain("Origem inválida");
    expect(erros({ ...DEV, CORS_ORIGINS: "app.exemplo.com" }).CORS_ORIGINS[0]).toContain("Origem inválida");
    expect(erros({ ...DEV, CORS_ORIGINS: "ftp://app.exemplo.com" }).CORS_ORIGINS[0]).toContain("Origem inválida");
  });

  it("valida PORT e TRUST_PROXY", () => {
    expect(valido({ ...DEV, PORT: "8080", TRUST_PROXY: "2" })).toMatchObject({ PORT: 8080, TRUST_PROXY: 2 });
    expect(erros({ ...DEV, PORT: "70000" }).PORT).toBeDefined();
    expect(erros({ ...DEV, TRUST_PROXY: "-1" }).TRUST_PROXY).toBeDefined();
  });
});

describe("validarEnv — produção", () => {
  it("aceita uma configuração segura e confia em 1 proxy por padrão", () => {
    expect(valido(PROD)).toMatchObject({
      NODE_ENV: "production",
      CORS_ORIGINS: ["https://build-plan.vercel.app"],
      TRUST_PROXY: 1,
    });
    expect(valido({ ...PROD, TRUST_PROXY: "0" }).TRUST_PROXY).toBe(0);
  });

  it("exige JWT_SECRET com 32+ caracteres e que não seja valor de exemplo", () => {
    expect(erros({ ...PROD, JWT_SECRET: "apenas-vinte-caracteres" }).JWT_SECRET[0]).toContain("ao menos 32");
    expect(erros({ ...PROD, JWT_SECRET: "troque-por-uma-string-secreta-forte" }).JWT_SECRET).toEqual([
      "JWT_SECRET parece um valor de exemplo. Gere um segredo aleatório.",
    ]);
    expect(erros({ ...PROD, JWT_SECRET: "ci-test-secret-nao-usar-em-producao" }).JWT_SECRET).toBeDefined();
  });

  it("recusa a senha de desenvolvimento no DATABASE_URL", () => {
    const url = "postgresql://buildplan:buildplan_dev_password@localhost:5432/buildplan_db";
    expect(erros({ ...PROD, DATABASE_URL: url }).DATABASE_URL[0]).toContain("exemplo/desenvolvimento");
  });

  it("exige CORS_ORIGINS explícita, com https e fora de localhost", () => {
    expect(erros({ ...PROD, CORS_ORIGINS: undefined }).CORS_ORIGINS[0]).toContain("obrigatória");
    expect(erros({ ...PROD, CORS_ORIGINS: "  " }).CORS_ORIGINS[0]).toContain("obrigatória");
    expect(erros({ ...PROD, CORS_ORIGINS: "http://build-plan.vercel.app" }).CORS_ORIGINS[0]).toContain("https://");
    expect(erros({ ...PROD, CORS_ORIGINS: "https://localhost:5173" }).CORS_ORIGINS[0]).toContain("localhost");
    expect(erros({ ...PROD, CORS_ORIGINS: "https://127.0.0.1" }).CORS_ORIGINS).toBeDefined();
  });

  it("as mesmas configurações fracas continuam aceitas fora de produção", () => {
    expect(valido({ ...PROD, NODE_ENV: "development", JWT_SECRET: "troque-por-uma-string-secreta-forte" })).toBeDefined();
    expect(valido({ ...PROD, NODE_ENV: "test", CORS_ORIGINS: "http://localhost:5173" })).toBeDefined();
  });
});

describe("carregarEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devolve o ambiente quando válido", () => {
    expect(carregarEnv(PROD).NODE_ENV).toBe("production");
  });

  it("encerra o processo com código 1 e loga só os campos, sem os valores", () => {
    const exit = jest.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);

    carregarEnv({ ...PROD, JWT_SECRET: "troque-este-segredo-de-exemplo-agora-mesmo" });

    expect(exit).toHaveBeenCalledWith(1);
    const saida = JSON.stringify(log.mock.calls);
    expect(saida).toContain("JWT_SECRET");
    expect(saida).not.toContain("troque-este-segredo");
  });
});
