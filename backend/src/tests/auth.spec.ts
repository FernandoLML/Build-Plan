// Caminho: /backend/src/tests/auth.spec.ts
// Testes de integração da autenticação (register / login).

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

const usuarioValido = {
  nome: "Fernando Luz",
  email: "fernando@buildplan.com",
  senha: "senhaForte123",
};

describe("POST /api/auth/register", () => {
  it("registra um usuário com sucesso e retorna token (201)", async () => {
    const res = await request(app).post("/api/auth/register").send(usuarioValido);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.usuario).toMatchObject({
      nome: usuarioValido.nome,
      email: usuarioValido.email,
    });
    // A senha (hash) nunca deve vazar na resposta.
    expect(res.body.usuario).not.toHaveProperty("senhaHash");
    expect(res.body.usuario).not.toHaveProperty("senha");
  });

  it("bloqueia registro com e-mail duplicado (409)", async () => {
    await request(app).post("/api/auth/register").send(usuarioValido);
    const res = await request(app).post("/api/auth/register").send(usuarioValido);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/já cadastrado/i);
  });

  it("rejeita payload inválido (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ nome: "x", email: "nao-eh-email", senha: "123" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("issues");
  });
});

describe("POST /api/auth/login", () => {
  it("autentica com credenciais corretas e retorna o token JWT", async () => {
    await request(app).post("/api/auth/register").send(usuarioValido);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuarioValido.email, senha: usuarioValido.senha });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".")).toHaveLength(3); // formato JWT
  });

  it("rejeita senha incorreta com mensagem genérica (401)", async () => {
    await request(app).post("/api/auth/register").send(usuarioValido);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuarioValido.email, senha: "senhaErrada999" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/credenciais inválidas/i);
  });

  it("rejeita e-mail inexistente com a mesma mensagem genérica (401)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ninguem@buildplan.com", senha: "qualquer123" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/credenciais inválidas/i);
  });
});