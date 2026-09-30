// Caminho: /backend/src/tests/tarefa.spec.ts
// Testes de integração de Tarefas (M3): CRUD, ordenação, conclusão
// automática, ownership e remoção em cascata.

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { criarUsuarioAutenticado, criarObra, criarEtapa } from "./helpers/auth.helper.js";

// Cria uma tarefa e devolve o corpo da resposta.
async function criarTarefa(
  token: string,
  etapaId: string,
  body: Record<string, unknown>,
): Promise<request.Response> {
  return request(app)
    .post(`/api/etapas/${etapaId}/tarefas`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

describe("POST /api/etapas/:etapaId/tarefas", () => {
  it("cria tarefa em etapa do usuário (201)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);

    const res = await criarTarefa(token, etapaId, { titulo: "Concretar sapatas" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      titulo: "Concretar sapatas",
      status: "PENDENTE", // default do Prisma
      etapaId,
    });
  });

  it("bloqueia criação em etapa de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);
    const etapaDeA = await criarEtapa(usuarioA.token, obraDeA);

    const res = await criarTarefa(usuarioB.token, etapaDeA, { titulo: "Invasão" });

    expect(res.status).toBe(404);
  });
});

describe("GET /api/etapas/:etapaId/tarefas", () => {
  it("lista tarefas ordenadas pelo campo 'ordem'", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);

    // Inserção fora de ordem para provar a ordenação do service.
    await criarTarefa(token, etapaId, { titulo: "Terceira", ordem: 3 });
    await criarTarefa(token, etapaId, { titulo: "Primeira", ordem: 1 });
    await criarTarefa(token, etapaId, { titulo: "Segunda", ordem: 2 });

    const res = await request(app)
      .get(`/api/etapas/${etapaId}/tarefas`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.map((t: { titulo: string }) => t.titulo)).toEqual([
      "Primeira",
      "Segunda",
      "Terceira",
    ]);
  });
});

describe("PUT /api/tarefas/:id — conclusão automática", () => {
  it("preenche dataConclusao automaticamente ao concluir sem enviá-la", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);
    const criada = await criarTarefa(token, etapaId, { titulo: "Pintura" });

    expect(criada.body.dataConclusao).toBeNull();

    const res = await request(app)
      .put(`/api/tarefas/${criada.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONCLUIDA" }); // sem dataConclusao explícita

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONCLUIDA");
    expect(res.body.dataConclusao).not.toBeNull();
    // Deve ser uma data ISO válida.
    expect(Number.isNaN(Date.parse(res.body.dataConclusao))).toBe(false);
  });
});

describe("Ownership de Tarefas — usuário B não acessa tarefa de A", () => {
  it("bloqueia GET, PUT e DELETE em tarefa de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);
    const etapaDeA = await criarEtapa(usuarioA.token, obraDeA);
    const tarefaDeA = await criarTarefa(usuarioA.token, etapaDeA, { titulo: "Privada" });
    const id = tarefaDeA.body.id;

    const get = await request(app)
      .get(`/api/tarefas/${id}`)
      .set("Authorization", `Bearer ${usuarioB.token}`);
    expect(get.status).toBe(404);

    const put = await request(app)
      .put(`/api/tarefas/${id}`)
      .set("Authorization", `Bearer ${usuarioB.token}`)
      .send({ titulo: "Sequestro" });
    expect(put.status).toBe(404);

    const del = await request(app)
      .delete(`/api/tarefas/${id}`)
      .set("Authorization", `Bearer ${usuarioB.token}`);
    expect(del.status).toBe(404);

    // A tarefa continua acessível para o dono A.
    const donoGet = await request(app)
      .get(`/api/tarefas/${id}`)
      .set("Authorization", `Bearer ${usuarioA.token}`);
    expect(donoGet.status).toBe(200);
  });
});

describe("Remoção em cascata", () => {
  it("ao deletar a ETAPA, as tarefas associadas são removidas (404 na busca)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);
    const tarefa = await criarTarefa(token, etapaId, { titulo: "Some comigo" });

    await request(app)
      .delete(`/api/etapas/${etapaId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const res = await request(app)
      .get(`/api/tarefas/${tarefa.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("ao deletar a OBRA, etapas e tarefas em cascata são removidas (404 na busca)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);
    const tarefa = await criarTarefa(token, etapaId, { titulo: "Cascata total" });

    await request(app)
      .delete(`/api/obras/${obraId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const res = await request(app)
      .get(`/api/tarefas/${tarefa.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});