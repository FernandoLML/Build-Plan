// Caminho: /backend/src/tests/etapa.spec.ts
// Testes de integração de Etapas (M3): CRUD, progresso % e ownership.

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { criarUsuarioAutenticado, criarObra, criarEtapa } from "./helpers/auth.helper.js";

const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";

describe("POST /api/obras/:obraId/etapas", () => {
  it("cria etapa com payload válido em obra do usuário (201)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(`/api/obras/${obraId}/etapas`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Fundação", ordem: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nome: "Fundação", ordem: 1, obraId });
    expect(res.body).toHaveProperty("id");
  });

  it("bloqueia criação em obra inexistente (404)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");

    const res = await request(app)
      .post(`/api/obras/${UUID_INEXISTENTE}/etapas`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Fundação" });

    expect(res.status).toBe(404);
  });

  it("bloqueia criação em obra de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);

    const res = await request(app)
      .post(`/api/obras/${obraDeA}/etapas`)
      .set("Authorization", `Bearer ${usuarioB.token}`)
      .send({ nome: "Invasão" });

    expect(res.status).toBe(404);
  });

  it("exige token de autenticação (401)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(`/api/obras/${obraId}/etapas`)
      .send({ nome: "Sem token" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/obras/:obraId/etapas", () => {
  it("lista etapas e calcula o progresso percentual (concluídas / total * 100)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId, "Alvenaria");

    // 4 tarefas: 3 concluídas + 1 pendente => 75%
    const criarTarefa = (status: string) =>
      request(app)
        .post(`/api/etapas/${etapaId}/tarefas`)
        .set("Authorization", `Bearer ${token}`)
        .send({ titulo: `Tarefa ${status}`, status });

    await criarTarefa("CONCLUIDA");
    await criarTarefa("CONCLUIDA");
    await criarTarefa("CONCLUIDA");
    await criarTarefa("PENDENTE");

    const res = await request(app)
      .get(`/api/obras/${obraId}/etapas`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: etapaId,
      totalTarefas: 4,
      tarefasConcluidas: 3,
      progresso: 75,
    });
  });

  it("retorna progresso 0 para etapa sem tarefas", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    await criarEtapa(token, obraId);

    const res = await request(app)
      .get(`/api/obras/${obraId}/etapas`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ totalTarefas: 0, progresso: 0 });
  });
});

describe("PUT /api/etapas/:etapaId", () => {
  it("atualiza nome e ordem da etapa (200)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId, "Nome Antigo", 0);

    const res = await request(app)
      .put(`/api/etapas/${etapaId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nome: "Nome Novo", ordem: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: "Nome Novo", ordem: 5 });
  });

  it("bloqueia atualização de etapa de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);
    const etapaDeA = await criarEtapa(usuarioA.token, obraDeA);

    const res = await request(app)
      .put(`/api/etapas/${etapaDeA}`)
      .set("Authorization", `Bearer ${usuarioB.token}`)
      .send({ nome: "Sequestro" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/etapas/:etapaId", () => {
  it("elimina etapa existente do usuário (204)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);

    const res = await request(app)
      .delete(`/api/etapas/${etapaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    // A etapa não deve mais aparecer na listagem.
    const lista = await request(app)
      .get(`/api/obras/${obraId}/etapas`)
      .set("Authorization", `Bearer ${token}`);
    expect(lista.body).toHaveLength(0);
  });

  it("bloqueia eliminação de etapa de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);
    const etapaDeA = await criarEtapa(usuarioA.token, obraDeA);

    const res = await request(app)
      .delete(`/api/etapas/${etapaDeA}`)
      .set("Authorization", `Bearer ${usuarioB.token}`);

    expect(res.status).toBe(404);
  });
});