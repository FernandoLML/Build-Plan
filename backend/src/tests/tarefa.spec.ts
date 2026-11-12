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

// Atualiza uma tarefa (PUT) com o token informado.
function atualizarTarefa(
  token: string,
  id: string,
  body: Record<string, unknown>,
): request.Test {
  return request(app).put(`/api/tarefas/${id}`).set("Authorization", `Bearer ${token}`).send(body);
}

// Cria usuário + obra + etapa e devolve token/etapaId prontos para uso.
async function cenario(sufixo = "dono") {
  const { token } = await criarUsuarioAutenticado(sufixo);
  const obraId = await criarObra(token);
  const etapaId = await criarEtapa(token, obraId);
  return { token, etapaId };
}

describe("PUT /api/tarefas/:id — ciclo de vida de dataConclusao", () => {
  it("limpa dataConclusao (null) ao reabrir uma tarefa concluída", async () => {
    const { token, etapaId } = await cenario();
    const criada = await criarTarefa(token, etapaId, { titulo: "Alvenaria" });
    const concluida = await atualizarTarefa(token, criada.body.id, { status: "CONCLUIDA" });
    expect(concluida.body.dataConclusao).not.toBeNull();

    for (const status of ["EM_ANDAMENTO", "PENDENTE", "BLOQUEADA"]) {
      await atualizarTarefa(token, criada.body.id, { status: "CONCLUIDA" }).expect(200);
      const reaberta = await atualizarTarefa(token, criada.body.id, { status });
      expect(reaberta.status).toBe(200);
      expect(reaberta.body.status).toBe(status);
      expect(reaberta.body.dataConclusao).toBeNull();
    }
  });

  it("ignora dataConclusao enviada junto com a reabertura (status prevalece)", async () => {
    const { token, etapaId } = await cenario();
    const criada = await criarTarefa(token, etapaId, { titulo: "Reboco" });
    await atualizarTarefa(token, criada.body.id, { status: "CONCLUIDA" }).expect(200);

    const res = await atualizarTarefa(token, criada.body.id, {
      status: "PENDENTE",
      dataConclusao: "2026-10-01T12:00:00.000Z",
    });
    expect(res.status).toBe(200);
    expect(res.body.dataConclusao).toBeNull();
  });

  it("não sobrescreve a dataConclusao ao reenviar CONCLUIDA (edição pelo formulário)", async () => {
    const { token, etapaId } = await cenario();
    const criada = await criarTarefa(token, etapaId, { titulo: "Forro" });
    const concluida = await atualizarTarefa(token, criada.body.id, {
      status: "CONCLUIDA",
      dataConclusao: "2026-10-01T12:00:00.000Z",
    });
    expect(concluida.body.dataConclusao).toBe("2026-10-01T12:00:00.000Z");

    const editada = await atualizarTarefa(token, criada.body.id, {
      titulo: "Forro de gesso",
      status: "CONCLUIDA",
    });
    expect(editada.status).toBe(200);
    expect(editada.body.dataConclusao).toBe("2026-10-01T12:00:00.000Z");
  });

  it("preenche dataConclusao ao criar tarefa já CONCLUIDA", async () => {
    const { token, etapaId } = await cenario();
    const res = await criarTarefa(token, etapaId, { titulo: "Já pronta", status: "CONCLUIDA" });
    expect(res.status).toBe(201);
    expect(res.body.dataConclusao).not.toBeNull();
  });
});

describe("PUT /api/tarefas/:id — campos anuláveis", () => {
  it("aceita null para limpar as datas previstas e a descrição", async () => {
    const { token, etapaId } = await cenario();
    const criada = await criarTarefa(token, etapaId, {
      titulo: "Fundação",
      descricao: "Sapatas corridas",
      dataInicioPrev: "2026-09-01T12:00:00.000Z",
      dataFimPrev: "2026-09-10T12:00:00.000Z",
    });
    expect(criada.body.dataInicioPrev).not.toBeNull();

    const res = await atualizarTarefa(token, criada.body.id, {
      descricao: null,
      dataInicioPrev: null,
      dataFimPrev: null,
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ descricao: null, dataInicioPrev: null, dataFimPrev: null });
    expect(res.body.titulo).toBe("Fundação"); // campos ausentes são preservados
  });

  it("dataConclusao null em tarefa concluída volta a ser preenchida (invariante)", async () => {
    const { token, etapaId } = await cenario();
    const criada = await criarTarefa(token, etapaId, { titulo: "Cobertura", status: "CONCLUIDA" });

    const res = await atualizarTarefa(token, criada.body.id, { dataConclusao: null });
    expect(res.status).toBe(200);
    expect(res.body.dataConclusao).not.toBeNull();
  });

  it("rejeita null nas datas da criação (400)", async () => {
    const { token, etapaId } = await cenario();
    const res = await criarTarefa(token, etapaId, { titulo: "Inválida", dataInicioPrev: null });
    expect(res.status).toBe(400);
  });

  it("rejeita data em formato não ISO na edição (400)", async () => {
    const { token, etapaId } = await cenario();
    const criada = await criarTarefa(token, etapaId, { titulo: "Datas" });
    const res = await atualizarTarefa(token, criada.body.id, { dataFimPrev: "10/09/2026" });
    expect(res.status).toBe(400);
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