// Caminho: /backend/src/tests/material.spec.ts
// Testes de integração do catálogo de Materiais (M4): CRUD, ownership e validação.

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { criarUsuarioAutenticado, criarObra, criarMaterial } from "./helpers/auth.helper.js";

const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";

describe("POST /api/obras/:obraId/materiais", () => {
  it("cria material com payload válido (201)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(`/api/obras/${obraId}/materiais`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Vergalhão 10mm", unidade: "barra", quantidade: 50, origem: "MANUAL" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: "Vergalhão 10mm", unidade: "barra", obraId });
    expect(res.body).toHaveProperty("id");
  });

  it("bloqueia criação em obra de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);

    const res = await request(app)
      .post(`/api/obras/${obraDeA}/materiais`)
      .set("Authorization", `Bearer ${usuarioB.token}`)
      .send({ nome: "Invasão", unidade: "un" });

    expect(res.status).toBe(404);
  });

  it("exige token (401)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(`/api/obras/${obraId}/materiais`)
      .send({ nome: "Sem token", unidade: "un" });

    expect(res.status).toBe(401);
  });

  describe("validação Zod", () => {
    it("rejeita quantidade negativa (400)", async () => {
      const { token } = await criarUsuarioAutenticado("dono");
      const obraId = await criarObra(token);

      const res = await request(app)
        .post(`/api/obras/${obraId}/materiais`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nome: "Areia", unidade: "m3", quantidade: -5 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("issues");
    });

    it("rejeita campos obrigatórios ausentes (400)", async () => {
      const { token } = await criarUsuarioAutenticado("dono");
      const obraId = await criarObra(token);

      const res = await request(app)
        .post(`/api/obras/${obraId}/materiais`)
        .set("Authorization", `Bearer ${token}`)
        .send({ quantidade: 10 }); // sem nome e sem unidade

      expect(res.status).toBe(400);
      const campos = res.body.issues.map((i: { campo: string }) => i.campo);
      expect(campos).toEqual(expect.arrayContaining(["nome", "unidade"]));
    });
  });
});

describe("GET /api/obras/:obraId/materiais", () => {
  it("lista apenas os materiais da obra", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    await criarMaterial(token, obraId, { nome: "Cimento" });
    await criarMaterial(token, obraId, { nome: "Cal" });

    const res = await request(app)
      .get(`/api/obras/${obraId}/materiais`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe("GET/PUT/DELETE /api/materiais/:id", () => {
  it("busca material por id (200)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const materialId = await criarMaterial(token, obraId);

    const res = await request(app)
      .get(`/api/materiais/${materialId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(materialId);
  });

  it("retorna 404 para material inexistente", async () => {
    const { token } = await criarUsuarioAutenticado("dono");

    const res = await request(app)
      .get(`/api/materiais/${UUID_INEXISTENTE}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("atualiza material (200)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const materialId = await criarMaterial(token, obraId);

    const res = await request(app)
      .put(`/api/materiais/${materialId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Cimento CP-IV", quantidade: 25 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: "Cimento CP-IV" });
    // Decimal é serializado como string no JSON.
    expect(String(res.body.quantidade)).toBe("25");
  });

  it("remove material (204)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const materialId = await criarMaterial(token, obraId);

    const del = await request(app)
      .delete(`/api/materiais/${materialId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    const check = await request(app)
      .get(`/api/materiais/${materialId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(check.status).toBe(404);
  });
});

describe("Ownership de Materiais — usuário B não acessa material de A", () => {
  it("bloqueia GET, PUT e DELETE em material alheio (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);
    const materialDeA = await criarMaterial(usuarioA.token, obraDeA);

    const get = await request(app)
      .get(`/api/materiais/${materialDeA}`)
      .set("Authorization", `Bearer ${usuarioB.token}`);
    expect(get.status).toBe(404);

    const put = await request(app)
      .put(`/api/materiais/${materialDeA}`)
      .set("Authorization", `Bearer ${usuarioB.token}`)
      .send({ nome: "Sequestro" });
    expect(put.status).toBe(404);

    const del = await request(app)
      .delete(`/api/materiais/${materialDeA}`)
      .set("Authorization", `Bearer ${usuarioB.token}`);
    expect(del.status).toBe(404);

    // Continua acessível para o dono A.
    const donoGet = await request(app)
      .get(`/api/materiais/${materialDeA}`)
      .set("Authorization", `Bearer ${usuarioA.token}`);
    expect(donoGet.status).toBe(200);
  });
});