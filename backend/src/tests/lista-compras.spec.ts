// Caminho: /backend/src/tests/lista-compras.spec.ts
// Testes de integração das Listas de Compras (M4 — Fase 2): geração/snapshot,
// totais com Decimal, fluxo "Informar", ownership e remoção em cascata.

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

const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";

// Vincula um material a uma etapa com uma quantidade específica.
async function vincular(
  token: string,
  etapaId: string,
  materialId: string,
  quantidade: number,
): Promise<void> {
  await request(app)
    .post(`/api/etapas/${etapaId}/materiais`)
    .set("Authorization", `Bearer ${token}`)
    .send({ materialId, quantidade })
    .expect(201);
}

function gerarLista(token: string, etapaId: string): Promise<request.Response> {
  return request(app)
    .post(`/api/etapas/${etapaId}/lista-compras`)
    .set("Authorization", `Bearer ${token}`)
    .send({});
}

// Monta obra + etapa + 1 material já vinculado; devolve ids e token.
async function cenarioComVinculo(sufixo: string, quantidade = 10) {
  const usuario = await criarUsuarioAutenticado(sufixo);
  const obraId = await criarObra(usuario.token);
  const etapaId = await criarEtapa(usuario.token, obraId);
  const materialId = await criarMaterial(usuario.token, obraId, { nome: "Cimento CP-II" });
  await vincular(usuario.token, etapaId, materialId, quantidade);
  return { ...usuario, obraId, etapaId, materialId };
}

describe("POST /api/etapas/:etapaId/lista-compras — geração/snapshot", () => {
  it("gera a lista a partir dos vínculos, congelando o snapshot dos itens (201)", async () => {
    const { token, etapaId, obraId, materialId } = await cenarioComVinculo("dono", 8);

    const res = await gerarLista(token, etapaId);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ obraId, etapaId });
    expect(res.body.itens).toHaveLength(1);

    const item = res.body.itens[0];
    expect(item).toMatchObject({
      materialId,
      descricao: "Cimento CP-II",
      unidade: "saco",
      origemPreco: "PENDENTE",
    });
    expect(Number(item.quantidade)).toBe(8); // snapshot da quantidade do vínculo
    expect(item.precoUnitario).toBeNull();
    expect(item.precoTotal).toBeNull();
  });

  it("rejeita geração sem materiais vinculados (400)", async () => {
    const usuario = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(usuario.token);
    const etapaId = await criarEtapa(usuario.token, obraId);

    const res = await gerarLista(usuario.token, etapaId);
    expect(res.status).toBe(400);
  });

  it("bloqueia geração em etapa de outro usuário (404)", async () => {
    const dono = await cenarioComVinculo("a");
    const outro = await criarUsuarioAutenticado("b");

    const res = await gerarLista(outro.token, dono.etapaId);
    expect(res.status).toBe(404);
  });
});

describe("Totais orçados (Decimal)", () => {
  it("calcula totalItens, itensSemPreco e totalOrcado", async () => {
    const usuario = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(usuario.token);
    const etapaId = await criarEtapa(usuario.token, obraId);
    const m1 = await criarMaterial(usuario.token, obraId, { nome: "Cimento" });
    const m2 = await criarMaterial(usuario.token, obraId, { nome: "Areia" });
    await vincular(usuario.token, etapaId, m1, 10);
    await vincular(usuario.token, etapaId, m2, 5);

    const res = await gerarLista(usuario.token, etapaId);

    // Sem preço de referência (SINAPI ainda não modelado) => tudo pendente.
    expect(res.body.totais).toMatchObject({ totalItens: 2, itensSemPreco: 2 });
    expect(Number(res.body.totais.totalOrcado)).toBe(0);
  });
});

describe('PATCH /api/itens-compra/:id — fluxo "Informar" preço', () => {
  it("informa o preço unitário e recalcula o precoTotal congelado", async () => {
    const { token, etapaId } = await cenarioComVinculo("dono", 10);
    const lista = await gerarLista(token, etapaId);
    const itemId = lista.body.itens[0].id;

    const res = await request(app)
      .patch(`/api/itens-compra/${itemId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ precoUnitario: 25.5 });

    expect(res.status).toBe(200);
    expect(Number(res.body.precoUnitario)).toBe(25.5);
    expect(Number(res.body.precoTotal)).toBe(255); // 25.5 * 10
    expect(res.body.origemPreco).toBe("MANUAL");
  });

  it("reflete o preço informado no total orçado da lista", async () => {
    const { token, etapaId } = await cenarioComVinculo("dono", 10);
    const lista = await gerarLista(token, etapaId);
    const listaId = lista.body.id;
    const itemId = lista.body.itens[0].id;

    await request(app)
      .patch(`/api/itens-compra/${itemId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ precoUnitario: 12 })
      .expect(200);

    const res = await request(app)
      .get(`/api/listas-compras/${listaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totais.itensSemPreco).toBe(0);
    expect(Number(res.body.totais.totalOrcado)).toBe(120); // 12 * 10
  });
});

describe("Ownership (404)", () => {
  it("bloqueia GET, DELETE da lista e PATCH do item de outro usuário", async () => {
    const dono = await cenarioComVinculo("dono");
    const outro = await criarUsuarioAutenticado("outro");
    const lista = await gerarLista(dono.token, dono.etapaId);
    const listaId = lista.body.id;
    const itemId = lista.body.itens[0].id;

    const get = await request(app)
      .get(`/api/listas-compras/${listaId}`)
      .set("Authorization", `Bearer ${outro.token}`);
    expect(get.status).toBe(404);

    const del = await request(app)
      .delete(`/api/listas-compras/${listaId}`)
      .set("Authorization", `Bearer ${outro.token}`);
    expect(del.status).toBe(404);

    const patch = await request(app)
      .patch(`/api/itens-compra/${itemId}`)
      .set("Authorization", `Bearer ${outro.token}`)
      .send({ precoUnitario: 99 });
    expect(patch.status).toBe(404);
  });

  it("retorna 404 ao listar listas de obra inexistente", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const res = await request(app)
      .get(`/api/obras/${UUID_INEXISTENTE}/listas-compras`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe("Remoção em cascata", () => {
  it("ao deletar a lista, os itens são removidos do banco", async () => {
    const { token, etapaId } = await cenarioComVinculo("dono");
    const lista = await gerarLista(token, etapaId);
    const listaId = lista.body.id;

    await request(app)
      .delete(`/api/listas-compras/${listaId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const itens = await prisma.itemCompra.findMany({ where: { listaComprasId: listaId } });
    expect(itens).toHaveLength(0);

    const get = await request(app)
      .get(`/api/listas-compras/${listaId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(get.status).toBe(404);
  });
});