// Caminho: /backend/src/tests/obra.spec.ts
// Testes de integração do CRUD de Obras, incluindo autorização e ownership.

import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";

// Helper: registra um usuário e devolve o token JWT dele.
async function criarUsuarioELogar(email: string): Promise<string> {
  const res = await request(app).post("/api/auth/register").send({
    nome: "Usuario Teste",
    email,
    senha: "senhaForte123",
  });
  return res.body.token as string;
}

describe("POST /api/obras", () => {
  it("cria uma obra com token válido (201)", async () => {
    const token = await criarUsuarioELogar("dono@buildplan.com");

    const res = await request(app)
      .post("/api/obras")
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Residência Ana", endereco: "Rua das Flores, 100" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: "Residência Ana" });
    expect(res.body).toHaveProperty("id");
  });

  it("bloqueia criação sem token (401)", async () => {
    const res = await request(app).post("/api/obras").send({ nome: "Obra sem dono" });

    expect(res.status).toBe(401);
  });

  it("bloqueia criação com token malformado (401)", async () => {
    const res = await request(app)
      .post("/api/obras")
      .set("Authorization", "Bearer token-invalido")
      .send({ nome: "Obra X" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/obras", () => {
  it("retorna apenas as obras do usuário logado", async () => {
    const tokenA = await criarUsuarioELogar("a@buildplan.com");
    const tokenB = await criarUsuarioELogar("b@buildplan.com");

    await request(app)
      .post("/api/obras")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ nome: "Obra do A" });
    await request(app)
      .post("/api/obras")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ nome: "Obra do B" });

    const resA = await request(app)
      .get("/api/obras")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body).toHaveLength(1);
    expect(resA.body[0].nome).toBe("Obra do A");
  });
});

describe("Ownership — usuário B não acessa obra do usuário A", () => {
  let tokenA: string;
  let tokenB: string;
  let obraIdA: string;

  beforeEach(async () => {
    tokenA = await criarUsuarioELogar("owner-a@buildplan.com");
    tokenB = await criarUsuarioELogar("owner-b@buildplan.com");

    const res = await request(app)
      .post("/api/obras")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ nome: "Obra Privada do A" });
    obraIdA = res.body.id;
  });

  it("impede B de VISUALIZAR a obra de A (404)", async () => {
    const res = await request(app)
      .get(`/api/obras/${obraIdA}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it("impede B de ATUALIZAR a obra de A (404)", async () => {
    const res = await request(app)
      .put(`/api/obras/${obraIdA}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ nome: "Tentativa de sequestro" });

    expect(res.status).toBe(404);
  });

  it("impede B de DELETAR a obra de A (404)", async () => {
    const res = await request(app)
      .delete(`/api/obras/${obraIdA}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);

    // Confirma que a obra continua acessível para o dono A.
    const check = await request(app)
      .get(`/api/obras/${obraIdA}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(check.status).toBe(200);
  });
});