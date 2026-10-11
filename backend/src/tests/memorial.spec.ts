// Caminho: /backend/src/tests/memorial.spec.ts
// Testes de integração do UC01 (M4 Fase 3): preview e importação do Memorial.

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { criarUsuarioAutenticado, criarObra } from "./helpers/auth.helper.js";

const UUID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";

const PREVIEW = (obraId: string) => `/api/obras/${obraId}/materiais/preview-memorial`;
const IMPORTAR = (obraId: string) => `/api/obras/${obraId}/materiais/importar-memorial`;

describe("POST .../preview-memorial", () => {
  it("processa CSV (text/csv) delimitado por vírgula", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const csv = "Nome,Unidade,Quantidade\nCimento,saco,10\nAreia,m3,2.5";

    const res = await request(app)
      .post(PREVIEW(obraId))
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/csv")
      .send(csv);

    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(2);
    expect(res.body.rejeitados).toHaveLength(0);
    expect(res.body.itens.map((i: { quantidade: number }) => i.quantidade)).toEqual([10, 2.5]);
  });

  it("processa CSV (text/csv) com ponto-e-vírgula e números pt-BR", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const csv = "Material;UN;Qtd\nCimento CP-II;saco;10,5\nVergalhão;barra;1.000,25";

    const res = await request(app)
      .post(PREVIEW(obraId))
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/csv")
      .send(csv);

    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(2);
    expect(res.body.itens[1]).toMatchObject({ nome: "Vergalhão", unidade: "barra", quantidade: 1000.25 });
  });

  it("aceita payload JSON { csv }", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(PREVIEW(obraId))
      .set("Authorization", `Bearer ${token}`)
      .send({ csv: "Nome,Unidade,Quantidade\nPrego,kg,5" });

    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(1);
    expect(res.body.itens[0]).toMatchObject({ nome: "Prego", unidade: "kg", quantidade: 5 });
  });

  it("aceita payload JSON { itens }", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(PREVIEW(obraId))
      .set("Authorization", `Bearer ${token}`)
      .send({
        itens: [
          { nome: "Cal", unidade: "saco", quantidade: 3 },
          { nome: "SemQtd", unidade: "un" }, // inválido
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(1);
    expect(res.body.rejeitados).toHaveLength(1);
  });

  it("separa linhas inválidas em rejeitados com motivo", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);
    const csv = "Nome,Unidade,Quantidade\nBom,un,5\n,un,3\nRuim,un,-2";

    const res = await request(app)
      .post(PREVIEW(obraId))
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/csv")
      .send(csv);

    expect(res.status).toBe(200);
    expect(res.body.itens).toHaveLength(1);
    expect(res.body.rejeitados).toHaveLength(2);
    // Cada rejeitado traz linha e motivo.
    for (const r of res.body.rejeitados) {
      expect(r).toHaveProperty("linha");
      expect(typeof r.motivo).toBe("string");
      expect(r.motivo.length).toBeGreaterThan(0);
    }
  });

  it("retorna 400 para CSV vazio", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(PREVIEW(obraId))
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/csv")
      .send("   ");

    expect(res.status).toBe(400);
  });

  it("retorna 400 para CSV sem cabeçalhos obrigatórios", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(PREVIEW(obraId))
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/csv")
      .send("Foo;Bar\n1;2");

    expect(res.status).toBe(400);
  });

  it("bloqueia preview em obra de outro usuário (404)", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);

    const res = await request(app)
      .post(PREVIEW(obraDeA))
      .set("Authorization", `Bearer ${usuarioB.token}`)
      .send({ csv: "Nome,Unidade,Quantidade\nX,un,1" });

    expect(res.status).toBe(404);
  });

  it("retorna 404 para obra inexistente", async () => {
    const { token } = await criarUsuarioAutenticado("dono");

    const res = await request(app)
      .post(PREVIEW(UUID_INEXISTENTE))
      .set("Authorization", `Bearer ${token}`)
      .send({ csv: "Nome,Unidade,Quantidade\nX,un,1" });

    expect(res.status).toBe(404);
  });
});

describe("POST .../importar-memorial", () => {
  it("importa em lote e persiste os materiais com origem MEMORIAL (201)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(IMPORTAR(obraId))
      .set("Authorization", `Bearer ${token}`)
      .send({
        itens: [
          { nome: "Cimento", unidade: "saco", quantidade: 10 },
          { nome: "Areia", unidade: "m3", quantidade: 2.5, codigoSinapi: "1234" },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.importados).toBe(2);

    // Verificação direta no banco (schema de teste).
    const materiais = await prisma.material.findMany({
      where: { obraId },
      orderBy: { nome: "asc" },
    });
    expect(materiais).toHaveLength(2);
    for (const m of materiais) {
      expect(m.origem).toBe("MEMORIAL");
    }
    const areia = materiais.find((m) => m.nome === "Areia");
    const cimento = materiais.find((m) => m.nome === "Cimento");
    expect(Number(areia?.quantidade)).toBe(2.5); // Decimal correto
    expect(Number(cimento?.quantidade)).toBe(10);
    expect(areia?.codigoSinapi).toBe("1234");
  });

  it("não persiste nada quando a carga tem item inválido (atomicidade)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(IMPORTAR(obraId))
      .set("Authorization", `Bearer ${token}`)
      .send({
        itens: [
          { nome: "Válido", unidade: "un", quantidade: 5 },
          { nome: "Inválido", unidade: "un", quantidade: -1 }, // viola positivo
        ],
      });

    expect(res.status).toBe(400);

    // Nenhum material deve ter sido criado.
    const materiais = await prisma.material.findMany({ where: { obraId } });
    expect(materiais).toHaveLength(0);
  });

  it("rejeita lista vazia (400)", async () => {
    const { token } = await criarUsuarioAutenticado("dono");
    const obraId = await criarObra(token);

    const res = await request(app)
      .post(IMPORTAR(obraId))
      .set("Authorization", `Bearer ${token}`)
      .send({ itens: [] });

    expect(res.status).toBe(400);
  });

  it("bloqueia importação em obra de outro usuário (404) e não persiste", async () => {
    const usuarioA = await criarUsuarioAutenticado("a");
    const usuarioB = await criarUsuarioAutenticado("b");
    const obraDeA = await criarObra(usuarioA.token);

    const res = await request(app)
      .post(IMPORTAR(obraDeA))
      .set("Authorization", `Bearer ${usuarioB.token}`)
      .send({ itens: [{ nome: "Invasor", unidade: "un", quantidade: 1 }] });

    expect(res.status).toBe(404);

    const materiais = await prisma.material.findMany({ where: { obraId: obraDeA } });
    expect(materiais).toHaveLength(0);
  });
});