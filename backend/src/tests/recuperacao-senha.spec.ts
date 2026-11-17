// Caminho: /backend/src/tests/recuperacao-senha.spec.ts
// "Esqueci minha senha": pedido (POST /api/auth/esqueci-senha) e troca
// (POST /api/auth/redefinir-senha). O envio de e-mail é interceptado com
// jest.spyOn para capturar o link sem depender de um servidor SMTP.

import { describe, it, expect, jest, afterEach } from "@jest/globals";
import request from "supertest";
import { app, createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { emailService } from "../services/email.service.js";
import {
  hashToken,
  montarLinkRedefinicao,
  VALIDADE_TOKEN_MINUTOS,
} from "../services/recuperacao-senha.service.js";
import { criarUsuarioAutenticado } from "./helpers/auth.helper.js";

const SENHA_ORIGINAL = "senhaForte123";
const SENHA_NOVA = "outraSenha456";
const RESPOSTA_GENERICA = /se o e-mail estiver cadastrado/i;

function interceptarEmail() {
  return jest.spyOn(emailService, "enviar").mockResolvedValue(true);
}

/** Extrai o token do link contido no e-mail interceptado. */
function tokenDoEmail(espiao: ReturnType<typeof interceptarEmail>): string {
  const texto = espiao.mock.calls[0][0].texto;
  const link = /https?:\/\/\S+/.exec(texto)?.[0] ?? "";
  return new URL(link).searchParams.get("token") ?? "";
}

async function login(email: string, senha: string) {
  return request(app).post("/api/auth/login").send({ email, senha });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("POST /api/auth/esqueci-senha", () => {
  it("envia o link por e-mail e guarda apenas o hash do token", async () => {
    const espiao = interceptarEmail();
    const { email, usuarioId } = await criarUsuarioAutenticado("recupera");

    const res = await request(app).post("/api/auth/esqueci-senha").send({ email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(RESPOSTA_GENERICA);
    expect(espiao).toHaveBeenCalledTimes(1);
    expect(espiao.mock.calls[0][0].para).toBe(email);

    const token = tokenDoEmail(espiao);
    expect(token).toMatch(/^[0-9a-f]{64}$/);

    const registros = await prisma.tokenRedefinicaoSenha.findMany({ where: { usuarioId } });
    expect(registros).toHaveLength(1);
    expect(registros[0].tokenHash).toBe(hashToken(token));
    expect(registros[0].tokenHash).not.toBe(token);

    const minutos = (registros[0].expiraEm.getTime() - Date.now()) / 60000;
    expect(minutos).toBeGreaterThan(VALIDADE_TOKEN_MINUTOS - 1);
    expect(minutos).toBeLessThanOrEqual(VALIDADE_TOKEN_MINUTOS);
  });

  it("responde igual para e-mail não cadastrado, sem enviar nada", async () => {
    const espiao = interceptarEmail();

    const res = await request(app)
      .post("/api/auth/esqueci-senha")
      .send({ email: "ninguem@buildplan.test" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(RESPOSTA_GENERICA);
    expect(espiao).not.toHaveBeenCalled();
    expect(await prisma.tokenRedefinicaoSenha.count()).toBe(0);
  });

  it("aceita o e-mail com maiúsculas e espaços (normalização)", async () => {
    const espiao = interceptarEmail();
    const { email } = await criarUsuarioAutenticado("recupera");

    await request(app)
      .post("/api/auth/esqueci-senha")
      .send({ email: `  ${email.toUpperCase()} ` });

    expect(espiao).toHaveBeenCalledTimes(1);
  });

  it("um novo pedido invalida o link anterior", async () => {
    const espiao = interceptarEmail();
    const { email, usuarioId } = await criarUsuarioAutenticado("recupera");

    await request(app).post("/api/auth/esqueci-senha").send({ email });
    const primeiro = tokenDoEmail(espiao);
    espiao.mockClear();
    await request(app).post("/api/auth/esqueci-senha").send({ email });

    expect(await prisma.tokenRedefinicaoSenha.count({ where: { usuarioId } })).toBe(1);
    const res = await request(app)
      .post("/api/auth/redefinir-senha")
      .send({ token: primeiro, senha: SENHA_NOVA });
    expect(res.status).toBe(400);
  });

  it("responde 200 mesmo se o envio do e-mail falhar, registrando o erro", async () => {
    jest.spyOn(emailService, "enviar").mockRejectedValue(new Error("SMTP fora do ar"));
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { email } = await criarUsuarioAutenticado("recupera");

    const res = await request(app).post("/api/auth/esqueci-senha").send({ email });
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toBe(200);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("[email]"), expect.any(Error));
  });

  it("rejeita e-mail inválido (400)", async () => {
    const res = await request(app).post("/api/auth/esqueci-senha").send({ email: "nao-eh-email" });
    expect(res.status).toBe(400);
  });

  it("limita os pedidos por IP (429)", async () => {
    interceptarEmail();
    const limitado = createApp({
      rateLimit: true,
      limites: {
        geral: { janelaMs: 60000, max: 1000 },
        login: { janelaMs: 60000, max: 1000 },
        cadastro: { janelaMs: 60000, max: 1000 },
        recuperacao: { janelaMs: 60000, max: 2 },
      },
    });
    const pedir = () =>
      request(limitado).post("/api/auth/esqueci-senha").send({ email: "a@buildplan.test" });

    expect((await pedir()).status).toBe(200);
    expect((await pedir()).status).toBe(200);
    const bloqueado = await pedir();
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.message).toMatch(/redefinição de senha/i);
  });
});

describe("POST /api/auth/redefinir-senha", () => {
  it("troca a senha: a nova entra e a antiga deixa de valer", async () => {
    const espiao = interceptarEmail();
    const { email } = await criarUsuarioAutenticado("recupera");
    await request(app).post("/api/auth/esqueci-senha").send({ email });

    const res = await request(app)
      .post("/api/auth/redefinir-senha")
      .send({ token: tokenDoEmail(espiao), senha: SENHA_NOVA });

    expect(res.status).toBe(200);
    expect((await login(email, SENHA_NOVA)).status).toBe(200);
    expect((await login(email, SENHA_ORIGINAL)).status).toBe(401);
  });

  it("o link só pode ser usado uma vez", async () => {
    const espiao = interceptarEmail();
    const { email } = await criarUsuarioAutenticado("recupera");
    await request(app).post("/api/auth/esqueci-senha").send({ email });
    const token = tokenDoEmail(espiao);

    await request(app).post("/api/auth/redefinir-senha").send({ token, senha: SENHA_NOVA });
    const segunda = await request(app)
      .post("/api/auth/redefinir-senha")
      .send({ token, senha: "maisUmaSenha789" });

    expect(segunda.status).toBe(400);
    expect(segunda.body.message).toMatch(/inválido ou expirado/i);
    expect((await login(email, SENHA_NOVA)).status).toBe(200);
  });

  it("recusa token expirado e mantém a senha", async () => {
    const espiao = interceptarEmail();
    const { email, usuarioId } = await criarUsuarioAutenticado("recupera");
    await request(app).post("/api/auth/esqueci-senha").send({ email });
    await prisma.tokenRedefinicaoSenha.updateMany({
      where: { usuarioId },
      data: { expiraEm: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .post("/api/auth/redefinir-senha")
      .send({ token: tokenDoEmail(espiao), senha: SENHA_NOVA });

    expect(res.status).toBe(400);
    expect((await login(email, SENHA_ORIGINAL)).status).toBe(200);
  });

  it("recusa token desconhecido (400)", async () => {
    const res = await request(app)
      .post("/api/auth/redefinir-senha")
      .send({ token: "a".repeat(64), senha: SENHA_NOVA });

    expect(res.status).toBe(400);
  });

  it("valida a nova senha (mínimo de 8 caracteres)", async () => {
    const res = await request(app)
      .post("/api/auth/redefinir-senha")
      .send({ token: "a".repeat(64), senha: "curta" });

    expect(res.status).toBe(400);
    expect(res.body.issues[0].campo).toBe("senha");
  });
});

describe("montarLinkRedefinicao", () => {
  it("aponta para a tela de redefinição do frontend com o token na query", () => {
    expect(montarLinkRedefinicao("abc123", "https://app.buildplan.test")).toBe(
      "https://app.buildplan.test/redefinir-senha?token=abc123",
    );
  });
});
