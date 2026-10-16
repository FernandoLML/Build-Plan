// Caminho: /backend/src/tests/log.spec.ts
// Testes de integração do Log de Rastreabilidade (Tela 6):
// timeline por vínculo, visão por obra, ownership e integridade dos dados.

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { criarUsuarioAutenticado, criarObra, criarEtapa, criarMaterial } from "./helpers/auth.helper.js";

const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";

function authPost(token: string, url: string, body: object) {
  return request(app).post(url).set("Authorization", `Bearer ${token}`).send(body);
}

async function patchStatus(token: string, vinculoId: string, status: string): Promise<void> {
  await request(app)
    .patch(`/api/vinculos/${vinculoId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status })
    .expect(200);
}

// Cria obra+etapa+material+vínculo e percorre PREVISTO->RECEBIDO->APLICADO (gera 2 logs).
async function cenarioComTransicoes(sufixo: string) {
  const usuario = await criarUsuarioAutenticado(sufixo);
  const obraId = await criarObra(usuario.token);
  const etapaId = await criarEtapa(usuario.token, obraId);
  const materialId = await criarMaterial(usuario.token, obraId, { nome: "Cimento CP-II" });
  const vinculo = await authPost(usuario.token, `/api/etapas/${etapaId}/materiais`, {
    materialId,
    quantidade: 10,
  });
  const vinculoId = vinculo.body.id as string;
  await patchStatus(usuario.token, vinculoId, "RECEBIDO");
  await patchStatus(usuario.token, vinculoId, "APLICADO");
  return { ...usuario, obraId, etapaId, materialId, vinculoId };
}

describe("GET /api/vinculos/:id/logs", () => {
  it("retorna a timeline ordenada (asc) com o executor (nome/email) e sem senha", async () => {
    const dono = await cenarioComTransicoes("dono");

    const res = await request(app)
      .get(`/api/vinculos/${dono.vinculoId}/logs`)
      .set("Authorization", `Bearer ${dono.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    // Ordem cronológica e integridade das transições.
    expect(res.body[0]).toMatchObject({ statusAnterior: "PREVISTO", statusNovo: "RECEBIDO" });
    expect(res.body[1]).toMatchObject({ statusAnterior: "RECEBIDO", statusNovo: "APLICADO" });

    // Dados do executor presentes, sem vazar o hash de senha.
    const executor = res.body[0].usuario;
    expect(executor).toMatchObject({ id: dono.usuarioId, email: dono.email });
    expect(executor.nome).toBeDefined();
    expect(executor).not.toHaveProperty("senhaHash");
  });

  it("bloqueia timeline de vínculo de outro usuário (404)", async () => {
    const dono = await cenarioComTransicoes("a");
    const outro = await criarUsuarioAutenticado("b");

    const res = await request(app)
      .get(`/api/vinculos/${dono.vinculoId}/logs`)
      .set("Authorization", `Bearer ${outro.token}`);

    expect(res.status).toBe(404);
  });

  it("retorna 404 para vínculo inexistente", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const res = await request(app)
      .get(`/api/vinculos/${UUID_INEXISTENTE}/logs`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/obras/:obraId/logs", () => {
  it("retorna a visão agregada (desc) com contexto de material e etapa", async () => {
    const dono = await cenarioComTransicoes("dono");

    const res = await request(app)
      .get(`/api/obras/${dono.obraId}/logs`)
      .set("Authorization", `Bearer ${dono.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    // Mais recente primeiro.
    expect(res.body[0].statusNovo).toBe("APLICADO");
    expect(res.body[1].statusNovo).toBe("RECEBIDO");

    // Contexto agregado para a auditoria da obra.
    expect(res.body[0].vinculo.material.nome).toBe("Cimento CP-II");
    expect(res.body[0].vinculo.etapa).toHaveProperty("nome");
    expect(res.body[0].usuario).toMatchObject({ email: dono.email });
  });

  it("isola logs entre obras/usuários — obra de outro usuário (404)", async () => {
    const dono = await cenarioComTransicoes("a");
    const outro = await criarUsuarioAutenticado("b");

    const res = await request(app)
      .get(`/api/obras/${dono.obraId}/logs`)
      .set("Authorization", `Bearer ${outro.token}`);

    expect(res.status).toBe(404);
  });

  it("retorna lista vazia para obra do usuário sem transições", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .get(`/api/obras/${obraId}/logs`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});