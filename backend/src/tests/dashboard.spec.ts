// Caminho: /backend/src/tests/dashboard.spec.ts
// Testes de integração do Dashboard da obra (M5 — Workstream A).

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { criarUsuarioAutenticado, criarObra, criarEtapa, criarMaterial } from "./helpers/auth.helper.js";

const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";

function authPost(token: string, url: string, body: object) {
  return request(app).post(url).set("Authorization", `Bearer ${token}`).send(body);
}

// Cria um vínculo e devolve seu id.
async function vincular(token: string, etapaId: string, materialId: string, quantidade: number): Promise<string> {
  const res = await authPost(token, `/api/etapas/${etapaId}/materiais`, { materialId, quantidade });
  return res.body.id as string;
}

async function patchStatus(token: string, vinculoId: string, status: string): Promise<void> {
  await request(app)
    .patch(`/api/vinculos/${vinculoId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status })
    .expect(200);
}

describe("GET /api/obras/:obraId/dashboard", () => {
  it("retorna indicadores agregados com distribuição de vínculos e zero-fill", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);

    // 4 materiais + 4 vínculos (qtd 10 cada).
    const m = await Promise.all([
      criarMaterial(token, obraId, { nome: "M1" }),
      criarMaterial(token, obraId, { nome: "M2" }),
      criarMaterial(token, obraId, { nome: "M3" }),
      criarMaterial(token, obraId, { nome: "M4" }),
    ]);
    const vinculos = await Promise.all(m.map((mid) => vincular(token, etapaId, mid, 10)));

    // Status: 2 PREVISTO, 1 RECEBIDO, 1 APLICADO.
    await patchStatus(token, vinculos[2], "RECEBIDO");
    await patchStatus(token, vinculos[3], "RECEBIDO");
    await patchStatus(token, vinculos[3], "APLICADO");

    // 2 tarefas, 1 concluída.
    const t1 = await authPost(token, `/api/etapas/${etapaId}/tarefas`, { titulo: "Tarefa 1" });
    await authPost(token, `/api/etapas/${etapaId}/tarefas`, { titulo: "Tarefa 2" });
    await request(app)
      .put(`/api/tarefas/${t1.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONCLUIDA" })
      .expect(200);

    // Lista de compras + preço informado em 2 itens (5 * 10 = 50 cada).
    const lista = await authPost(token, `/api/etapas/${etapaId}/lista-compras`, {});
    const itens = lista.body.itens as { id: string }[];
    for (const item of itens.slice(0, 2)) {
      await request(app)
        .patch(`/api/itens-compra/${item.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ precoUnitario: 5 })
        .expect(200);
    }

    const res = await request(app)
      .get(`/api/obras/${obraId}/dashboard`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.etapas.total).toBe(1);
    expect(res.body.materiais.total).toBe(4);

    expect(res.body.vinculos.total).toBe(4);
    expect(res.body.vinculos.porStatus.PREVISTO).toEqual({ quantidade: 2, percentual: 50 });
    expect(res.body.vinculos.porStatus.RECEBIDO).toEqual({ quantidade: 1, percentual: 25 });
    expect(res.body.vinculos.porStatus.APLICADO).toEqual({ quantidade: 1, percentual: 25 });

    expect(res.body.progressoTarefas).toEqual({ total: 2, concluidas: 1, percentual: 50 });

    expect(Number(res.body.orcamento.totalOrcado)).toBe(100); // 2 itens * (5*10)
    expect(res.body.orcamento.itensSemPreco).toBe(2);
  });

  it("retorna zeros para obra recém-criada (zero-fill de todos os status)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .get(`/api/obras/${obraId}/dashboard`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.vinculos.total).toBe(0);
    expect(res.body.vinculos.porStatus.PREVISTO).toEqual({ quantidade: 0, percentual: 0 });
    expect(res.body.vinculos.porStatus.RECEBIDO).toEqual({ quantidade: 0, percentual: 0 });
    expect(res.body.vinculos.porStatus.APLICADO).toEqual({ quantidade: 0, percentual: 0 });
    expect(res.body.progressoTarefas.percentual).toBe(0);
    expect(res.body.orcamento.totalOrcado).toBe("0.00");
  });

  it("bloqueia dashboard de obra de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);

    const res = await request(app)
      .get(`/api/obras/${obraDeA}/dashboard`)
      .set("Authorization", `Bearer ${usuarioB.token}`);

    expect(res.status).toBe(404);
  });

  it("retorna 404 para obra inexistente", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const res = await request(app)
      .get(`/api/obras/${UUID_INEXISTENTE}/dashboard`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});