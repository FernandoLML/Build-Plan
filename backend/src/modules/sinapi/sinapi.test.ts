// Caminho: /backend/src/modules/sinapi/sinapi.test.ts
// Teste de integração (Jest + Supertest) da rota GET /api/sinapi.
// Usa Postgres real (padrão do backend-ci.yml): semeia ItemSinapi e consulta.
// Autentica com JWT HS256 assinado com o mesmo JWT_SECRET da aplicação.

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET as string;

function tokenValido(): string {
  return jwt.sign({ sub: "user-id-teste" }, JWT_SECRET, { algorithm: "HS256" });
}

// Competência comum aos registros de teste.
const ref = { mesReferencia: 8, anoReferencia: 2025 };

const seed = [
  // SC — NÃO desonerado (3 "cimento" para exercitar o limit)
  { codigo: "00001379", descricao: "CIMENTO PORTLAND COMPOSTO CP II-32", unidade: "KG", precoMediano: "0.74", uf: "SC", regime: "NAO_DESONERADO" as const, tipo: "INSUMO" as const, ...ref },
  { codigo: "00001380", descricao: "CIMENTO PORTLAND CP IV-32", unidade: "KG", precoMediano: "0.78", uf: "SC", regime: "NAO_DESONERADO" as const, tipo: "INSUMO" as const, ...ref },
  { codigo: "00001381", descricao: "CIMENTO PORTLAND CP V-ARI", unidade: "KG", precoMediano: "0.95", uf: "SC", regime: "NAO_DESONERADO" as const, tipo: "INSUMO" as const, ...ref },
  { codigo: "00000370", descricao: "AREIA MEDIA - POSTO JAZIDA", unidade: "M3", precoMediano: "92.50", uf: "SC", regime: "NAO_DESONERADO" as const, tipo: "INSUMO" as const, ...ref },
  // PR — NÃO desonerado (mesmo código, UF diferente → chave natural distinta)
  { codigo: "00001379", descricao: "CIMENTO PORTLAND COMPOSTO CP II-32", unidade: "KG", precoMediano: "0.80", uf: "PR", regime: "NAO_DESONERADO" as const, tipo: "INSUMO" as const, ...ref },
  // SC — DESONERADO (mesmo código, regime diferente → chave natural distinta)
  { codigo: "00001379", descricao: "CIMENTO PORTLAND COMPOSTO CP II-32", unidade: "KG", precoMediano: "0.70", uf: "SC", regime: "DESONERADO" as const, tipo: "INSUMO" as const, ...ref },
];

beforeAll(async () => {
  await prisma.itemSinapi.deleteMany();
  await prisma.itemSinapi.createMany({ data: seed });
});

afterAll(async () => {
  await prisma.itemSinapi.deleteMany();
  await prisma.$disconnect();
});

describe("GET /api/sinapi", () => {
  it("retorna 401 sem token JWT", async () => {
    const res = await request(app).get("/api/sinapi").query({ q: "cimento" });
    expect(res.status).toBe(401);
  });

  it("retorna 401 com token inválido", async () => {
    const res = await request(app)
      .get("/api/sinapi")
      .query({ q: "cimento" })
      .set("Authorization", "Bearer token-invalido");
    expect(res.status).toBe(401);
  });

  it("retorna 400 quando 'q' tem menos de 2 caracteres", async () => {
    const res = await request(app)
      .get("/api/sinapi")
      .query({ q: "c" })
      .set("Authorization", `Bearer ${tokenValido()}`);
    expect(res.status).toBe(400);
    // Mensagem do Zod propagada pelo handler de erro central.
    // (Ajuste o caminho caso o seu handler use outro formato de corpo.)
    expect(JSON.stringify(res.body)).toContain("2 caracteres");
  });

  it("retorna 200 com itens compatíveis com o termo pesquisado", async () => {
    const res = await request(app)
      .get("/api/sinapi")
      .query({ q: "cimento", uf: "SC", regime: "NAO_DESONERADO" })
      .set("Authorization", `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    for (const item of res.body) {
      expect(item.descricao.toLowerCase()).toContain("cimento");
      expect(item.uf).toBe("SC");
      expect(item.regime).toBe("NAO_DESONERADO");
    }
  });

  it("respeita o parâmetro 'limit'", async () => {
    const res = await request(app)
      .get("/api/sinapi")
      .query({ q: "cimento", uf: "SC", regime: "NAO_DESONERADO", limit: 2 })
      .set("Authorization", `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("filtra por UF", async () => {
    const res = await request(app)
      .get("/api/sinapi")
      .query({ q: "cimento", uf: "PR" })
      .set("Authorization", `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].uf).toBe("PR");
  });

  it("filtra por regime", async () => {
    const res = await request(app)
      .get("/api/sinapi")
      .query({ q: "cimento", uf: "SC", regime: "DESONERADO" })
      .set("Authorization", `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].regime).toBe("DESONERADO");
  });
});