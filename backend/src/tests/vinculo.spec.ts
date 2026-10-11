// Caminho: /backend/src/tests/vinculo.spec.ts
// Testes de integração do Vínculo Material-Etapa (M4): criação, consistência,
// duplicidade, máquina de estados RN01 e auditoria RNF04 (log de rastreabilidade).

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import {
  criarUsuarioAutenticado,
  criarObra,
  criarEtapa,
  criarMaterial,
} from "./helpers/auth.helper.js";

// Cria um vínculo (POST aninhado na etapa) e devolve a resposta completa.
function criarVinculo(
  token: string,
  etapaId: string,
  body: Record<string, unknown>,
): Promise<request.Response> {
  return request(app)
    .post(`/api/etapas/${etapaId}/materiais`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

function patchStatus(
  token: string,
  vinculoId: string,
  status: string,
): Promise<request.Response> {
  return request(app)
    .patch(`/api/vinculos/${vinculoId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status });
}

// Monta uma obra com uma etapa e um material (mesma obra) para o usuário.
async function cenarioBase(sufixo: string) {
  const usuario = await criarUsuarioAutenticado(sufixo);
  const obraId = await criarObra(usuario.token);
  const etapaId = await criarEtapa(usuario.token, obraId);
  const materialId = await criarMaterial(usuario.token, obraId);
  return { ...usuario, obraId, etapaId, materialId };
}

describe("POST /api/etapas/:etapaId/materiais", () => {
  it("cria vínculo material-etapa (201) com status inicial PREVISTO", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");

    const res = await criarVinculo(token, etapaId, { materialId, quantidade: 12, local: "Térreo" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ etapaId, materialId, status: "PREVISTO", local: "Térreo" });
    expect(res.body.dataRecebimento).toBeNull();
    expect(res.body.dataAplicacao).toBeNull();
  });

  it("rejeita quantidade não positiva via Zod (400)", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");

    const res = await criarVinculo(token, etapaId, { materialId, quantidade: 0 });

    expect(res.status).toBe(400);
  });

  it("rejeita vínculo de material de OUTRA obra (400)", async () => {
    const usuario = await criarUsuarioAutenticado("dono");
    const obra1 = await criarObra(usuario.token, "Obra 1");
    const obra2 = await criarObra(usuario.token, "Obra 2");
    const materialObra1 = await criarMaterial(usuario.token, obra1);
    const etapaObra2 = await criarEtapa(usuario.token, obra2);

    const res = await criarVinculo(usuario.token, etapaObra2, { materialId: materialObra1, quantidade: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mesma obra/i);
  });

  it("bloqueia material de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await cenarioBase("b");
    const obraDeA = await criarObra(usuarioA.token);
    const materialDeA = await criarMaterial(usuarioA.token, obraDeA);

    // B tenta vincular o material de A em uma etapa de B.
    const res = await criarVinculo(usuarioB.token, usuarioB.etapaId, {
      materialId: materialDeA,
      quantidade: 3,
    });

    expect(res.status).toBe(404);
  });

  it("bloqueia duplicidade do par material/etapa (409)", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");

    const primeiro = await criarVinculo(token, etapaId, { materialId, quantidade: 10 });
    expect(primeiro.status).toBe(201);

    const duplicado = await criarVinculo(token, etapaId, { materialId, quantidade: 7 });
    expect(duplicado.status).toBe(409);
  });
});

describe("Máquina de estados RN01 — PATCH /api/vinculos/:id/status", () => {
  it("percorre PREVISTO -> RECEBIDO -> APLICADO preenchendo as datas", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");
    const criado = await criarVinculo(token, etapaId, { materialId, quantidade: 10 });
    const vinculoId = criado.body.id;

    const recebido = await patchStatus(token, vinculoId, "RECEBIDO");
    expect(recebido.status).toBe(200);
    expect(recebido.body.status).toBe("RECEBIDO");
    expect(recebido.body.dataRecebimento).not.toBeNull();
    expect(recebido.body.dataAplicacao).toBeNull();

    const aplicado = await patchStatus(token, vinculoId, "APLICADO");
    expect(aplicado.status).toBe(200);
    expect(aplicado.body.status).toBe("APLICADO");
    expect(aplicado.body.dataAplicacao).not.toBeNull();
    // dataRecebimento preservada (não sobrescrita).
    expect(aplicado.body.dataRecebimento).toBe(recebido.body.dataRecebimento);
  });

  it("bloqueia pular etapas: PREVISTO -> APLICADO (400)", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");
    const criado = await criarVinculo(token, etapaId, { materialId, quantidade: 10 });

    const res = await patchStatus(token, criado.body.id, "APLICADO");
    expect(res.status).toBe(400);
  });

  it("bloqueia regressão: RECEBIDO -> PREVISTO (400)", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");
    const criado = await criarVinculo(token, etapaId, { materialId, quantidade: 10 });
    await patchStatus(token, criado.body.id, "RECEBIDO");

    const res = await patchStatus(token, criado.body.id, "PREVISTO");
    expect(res.status).toBe(400);
  });

  it("bloqueia transição para o mesmo status (400)", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");
    const criado = await criarVinculo(token, etapaId, { materialId, quantidade: 10 });

    const res = await patchStatus(token, criado.body.id, "PREVISTO");
    expect(res.status).toBe(400);
  });

  it("bloqueia atualização de status de vínculo alheio (404)", async () => {
    const dono = await cenarioBase("dono");
    const outro = await criarUsuarioAutenticado("outro");
    const criado = await criarVinculo(dono.token, dono.etapaId, {
      materialId: dono.materialId,
      quantidade: 10,
    });

    const res = await patchStatus(outro.token, criado.body.id, "RECEBIDO");
    expect(res.status).toBe(404);
  });
});

describe("Auditoria RNF04 — log de rastreabilidade atômico", () => {
  it("grava um log para cada transição com statusAnterior, statusNovo e usuarioId", async () => {
    const { token, usuarioId, etapaId, materialId } = await cenarioBase("dono");
    const criado = await criarVinculo(token, etapaId, { materialId, quantidade: 10 });
    const vinculoId = criado.body.id;

    await patchStatus(token, vinculoId, "RECEBIDO");
    await patchStatus(token, vinculoId, "APLICADO");

    // Consulta direta ao banco (schema de teste) para auditar os logs.
    const logs = await prisma.logRastreabilidade.findMany({
      where: { vinculoId },
      orderBy: { criadoEm: "asc" },
    });

    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      vinculoId,
      usuarioId,
      statusAnterior: "PREVISTO",
      statusNovo: "RECEBIDO",
    });
    expect(logs[1]).toMatchObject({
      vinculoId,
      usuarioId,
      statusAnterior: "RECEBIDO",
      statusNovo: "APLICADO",
    });
  });

  it("não grava log quando a transição é inválida (atomicidade)", async () => {
    const { token, etapaId, materialId } = await cenarioBase("dono");
    const criado = await criarVinculo(token, etapaId, { materialId, quantidade: 10 });
    const vinculoId = criado.body.id;

    // Transição inválida (pula etapa) — deve falhar sem efeitos colaterais.
    await patchStatus(token, vinculoId, "APLICADO");

    const logs = await prisma.logRastreabilidade.findMany({ where: { vinculoId } });
    expect(logs).toHaveLength(0);
  });
});

describe("DELETE /api/vinculos/:id", () => {
  it("remove vínculo do dono (204) e bloqueia o de outro usuário (404)", async () => {
    const dono = await cenarioBase("dono");
    const outro = await criarUsuarioAutenticado("outro");
    const criado = await criarVinculo(dono.token, dono.etapaId, {
      materialId: dono.materialId,
      quantidade: 10,
    });
    const vinculoId = criado.body.id;

    const alheio = await request(app)
      .delete(`/api/vinculos/${vinculoId}`)
      .set("Authorization", `Bearer ${outro.token}`);
    expect(alheio.status).toBe(404);

    const proprio = await request(app)
      .delete(`/api/vinculos/${vinculoId}`)
      .set("Authorization", `Bearer ${dono.token}`);
    expect(proprio.status).toBe(204);
  });
});