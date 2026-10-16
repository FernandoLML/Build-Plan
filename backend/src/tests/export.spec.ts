// Caminho: /backend/src/tests/export.spec.ts
// Testes de integração da exportação CSV da lista de compras (M5 — Workstream B).

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { criarUsuarioAutenticado, criarObra, criarEtapa, criarMaterial } from "./helpers/auth.helper.js";

function authPost(token: string, url: string, body: object) {
  return request(app).post(url).set("Authorization", `Bearer ${token}`).send(body);
}

// Monta obra+etapa+2 vínculos e gera a lista; devolve token, listaId e itens.
async function cenarioComLista(sufixo: string) {
  const { token } = await criarUsuarioAutenticado(sufixo);
  const obraId = await criarObra(token);
  const etapaId = await criarEtapa(token, obraId);

  // Nome com vírgula para exercitar o escape de CSV.
  const m1 = await criarMaterial(token, obraId, { nome: "Cimento, CP-II", unidade: "saco" });
  const m2 = await criarMaterial(token, obraId, { nome: "Areia", unidade: "m3" });
  await authPost(token, `/api/etapas/${etapaId}/materiais`, { materialId: m1, quantidade: 10 });
  await authPost(token, `/api/etapas/${etapaId}/materiais`, { materialId: m2, quantidade: 5 });

  const lista = await authPost(token, `/api/etapas/${etapaId}/lista-compras`, {});
  const itens = lista.body.itens as { id: string; descricao: string }[];

  // Informa preço apenas no item com vírgula (7.5 * 10 = 75).
  const itemComVirgula = itens.find((i) => i.descricao.includes("Cimento"))!;
  await request(app)
    .patch(`/api/itens-compra/${itemComVirgula.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ precoUnitario: 7.5 })
    .expect(200);

  return { token, listaId: lista.body.id as string };
}

describe("GET /api/listas-compras/:id/export.csv", () => {
  it("exporta CSV com headers HTTP e cabeçalho de colunas corretos", async () => {
    const { token, listaId } = await cenarioComLista("dono");

    const res = await request(app)
      .get(`/api/listas-compras/${listaId}/export.csv`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-type"]).toContain("charset=utf-8");
    expect(res.headers["content-disposition"]).toBe(
      `attachment; filename="lista-compras-${listaId}.csv"`,
    );

    const linhas = res.text.split("\r\n");
    expect(linhas[0]).toBe("Descricao,Unidade,Quantidade,Preco Unitario,Preco Total,Origem Preco");
    expect(linhas).toHaveLength(3); // cabeçalho + 2 itens
  });

  it("escapa campos com vírgula e reflete preço informado e pendente", async () => {
    const { token, listaId } = await cenarioComLista("dono");

    const res = await request(app)
      .get(`/api/listas-compras/${listaId}/export.csv`)
      .set("Authorization", `Bearer ${token}`);

    // O nome com vírgula deve vir entre aspas.
    expect(res.text).toContain('"Cimento, CP-II"');
    // Item com preço informado → origem MANUAL; item sem preço → PENDENTE.
    expect(res.text).toContain("MANUAL");
    expect(res.text).toContain("PENDENTE");
    // Preço total do item informado (7.5 * 10 = 75) presente.
    expect(res.text).toContain("75");
  });

  it("bloqueia exportação de lista de outro usuário (404)", async () => {
    const dono = await cenarioComLista("dono");
    const outro = await criarUsuarioAutenticado("outro");

    const res = await request(app)
      .get(`/api/listas-compras/${dono.listaId}/export.csv`)
      .set("Authorization", `Bearer ${outro.token}`);

    expect(res.status).toBe(404);
  });
});