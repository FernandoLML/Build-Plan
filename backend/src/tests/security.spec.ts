// Caminho: /backend/src/tests/security.spec.ts
// Hardening da API (Etapa 5): headers do helmet, rate limiting e trust proxy.
// O `app` padrão roda com NODE_ENV=test (rate limit desligado); aqui criamos
// instâncias com o limitador ligado e limites baixos para exercitar o 429.

import { describe, it, expect, jest, afterEach } from "@jest/globals";
import request from "supertest";
import { app, createApp } from "../app.js";
import { env } from "../config/env.js";
import type { LimitesRateLimit } from "../middlewares/rate-limit.middleware.js";

const MINUTO = 60 * 1000;

function limites(parcial: Partial<LimitesRateLimit> = {}): LimitesRateLimit {
  return {
    geral: { janelaMs: MINUTO, max: 1000 },
    login: { janelaMs: MINUTO, max: 1000 },
    cadastro: { janelaMs: MINUTO, max: 1000 },
    recuperacao: { janelaMs: MINUTO, max: 1000 },
    ...parcial,
  };
}

const loginInvalido = { email: "ninguem@buildplan.test", senha: "senha-errada-123" };

describe("Headers de segurança (helmet)", () => {
  it("envia os headers de proteção e não expõe a tecnologia do servidor", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
    expect(res.headers["strict-transport-security"]).toBe("max-age=31536000; includeSubDomains");
    expect(res.headers["content-security-policy"]).toContain("default-src 'none'");
    expect(res.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });

  it("não bloqueia o consumo cross-origin pelo frontend (CORP + CORS)", async () => {
    const origem = env.CORS_ORIGINS[0];
    const res = await request(app).get("/api/health").set("Origin", origem);

    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
    expect(res.headers["access-control-allow-origin"]).toBe(origem);
    expect(res.headers["access-control-expose-headers"]).toContain("Content-Disposition");
  });
});

describe("Rate limiting", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fica desligado em NODE_ENV=test (app padrão)", async () => {
    for (let i = 0; i < 12; i++) {
      const res = await request(app).post("/api/auth/login").send(loginInvalido);
      expect(res.status).toBe(401);
    }
  });

  it("bloqueia o login após exceder as tentativas que falharam (429)", async () => {
    const limitado = createApp({ rateLimit: true, limites: limites({ login: { janelaMs: MINUTO, max: 3 } }) });

    for (let i = 0; i < 3; i++) {
      const res = await request(limitado).post("/api/auth/login").send(loginInvalido);
      expect(res.status).toBe(401);
    }
    const bloqueada = await request(limitado)
      .post("/api/auth/login")
      .set("Origin", env.CORS_ORIGINS[0])
      .send(loginInvalido);

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body).toEqual({ message: "Muitas tentativas de login. Tente novamente em alguns minutos." });
    expect(Number(bloqueada.headers["retry-after"])).toBeGreaterThan(0);
    expect(bloqueada.headers["ratelimit-policy"]).toContain("3;w=60");
    // O 429 também carrega os headers de CORS (o frontend consegue ler a mensagem).
    expect(bloqueada.headers["access-control-allow-origin"]).toBe(env.CORS_ORIGINS[0]);
    // Outras rotas da API seguem funcionando para o mesmo IP.
    expect((await request(limitado).get("/api/health")).status).toBe(200);
  });

  it("logins bem-sucedidos não consomem a cota de tentativas", async () => {
    const limitado = createApp({ rateLimit: true, limites: limites({ login: { janelaMs: MINUTO, max: 2 } }) });
    const usuario = { nome: "Ana Lima", email: "ana@buildplan.test", senha: "senhaForte123" };
    await request(limitado)
      .post("/api/auth/register")
      .send({ ...usuario, aceitePrivacidade: true })
      .expect(201);

    for (let i = 0; i < 4; i++) {
      const res = await request(limitado).post("/api/auth/login").send({ email: usuario.email, senha: usuario.senha });
      expect(res.status).toBe(200);
    }
  });

  it("limita cadastros por IP, contando também os bem-sucedidos", async () => {
    const limitado = createApp({ rateLimit: true, limites: limites({ cadastro: { janelaMs: MINUTO, max: 2 } }) });
    const cadastro = (n: number) =>
      request(limitado)
        .post("/api/auth/register")
        .send({
          nome: `Usuário ${n}`,
          email: `u${n}@buildplan.test`,
          senha: "senhaForte123",
          aceitePrivacidade: true,
        });

    expect((await cadastro(1)).status).toBe(201);
    expect((await cadastro(2)).status).toBe(201);
    const bloqueado = await cadastro(3);

    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.message).toContain("Muitos cadastros");
  });

  it("aplica o limite geral à API, sem contar o health-check", async () => {
    const limitado = createApp({ rateLimit: true, limites: limites({ geral: { janelaMs: MINUTO, max: 2 } }) });

    for (let i = 0; i < 5; i++) {
      expect((await request(limitado).get("/api/health")).status).toBe(200);
    }
    // Sem token → 401, mas cada chamada consome a cota geral.
    expect((await request(limitado).get("/api/obras")).status).toBe(401);
    expect((await request(limitado).get("/api/obras")).status).toBe(401);
    const bloqueada = await request(limitado).get("/api/obras");

    expect(bloqueada.status).toBe(429);
    expect(bloqueada.body.message).toContain("Muitas requisições");
  });

  it("com trust proxy = 1, conta por IP real do cliente (X-Forwarded-For do Nginx)", async () => {
    const limitado = createApp({
      rateLimit: true,
      trustProxy: 1,
      limites: limites({ login: { janelaMs: MINUTO, max: 1 } }),
    });
    const tentar = (ip: string) =>
      request(limitado).post("/api/auth/login").set("X-Forwarded-For", ip).send(loginInvalido);

    expect((await tentar("203.0.113.10")).status).toBe(401);
    expect((await tentar("203.0.113.10")).status).toBe(429);
    // Outro cliente atrás do mesmo proxy tem a própria cota.
    expect((await tentar("203.0.113.20")).status).toBe(401);
  });

  it("sem proxy confiável, ignora X-Forwarded-For forjado pelo cliente", async () => {
    // O express-rate-limit avisa no console quando vê o header sem trust proxy.
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const limitado = createApp({
      rateLimit: true,
      trustProxy: 0,
      limites: limites({ login: { janelaMs: MINUTO, max: 1 } }),
    });
    const tentar = (ip: string) =>
      request(limitado).post("/api/auth/login").set("X-Forwarded-For", ip).send(loginInvalido);

    expect((await tentar("203.0.113.10")).status).toBe(401);
    // Trocar o header não zera o contador: o IP usado é o da conexão.
    expect((await tentar("198.51.100.99")).status).toBe(429);
  });
});
