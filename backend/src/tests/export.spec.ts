// Caminho: /backend/src/tests/export.spec.ts
// Testes de integração da exportação da lista de compras: CSV (M5 — Workstream B)
// e as versões .xlsx / .pdf (Etapa 4).

import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import ExcelJS from "exceljs";
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
  const m1 = await criarMaterial(token, obraId, { nome: "Cimento, CP-II", unidade: "saco", codigoSinapi: "00001379" });
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

// Supertest não bufferiza binários por padrão: junta os chunks num Buffer.
// Em tempo de execução o "res" do parser é o IncomingMessage (um stream).
function binario(res: request.Response, callback: (err: Error | null, body: Buffer) => void): void {
  const stream = res as unknown as NodeJS.ReadableStream;
  const partes: Buffer[] = [];
  stream.on("data", (parte: Buffer) => partes.push(parte));
  stream.on("end", () => callback(null, Buffer.concat(partes)));
}

function baixar(token: string, url: string) {
  return request(app).get(url).set("Authorization", `Bearer ${token}`).buffer(true).parse(binario);
}

describe("GET /api/listas-compras/:id/export.xlsx", () => {
  it("exporta a planilha com headers HTTP, nome do arquivo pela etapa e itens", async () => {
    const { token, listaId } = await cenarioComLista("dono");

    const res = await baixar(token, `/api/listas-compras/${listaId}/export.xlsx`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers["content-disposition"]).toBe('attachment; filename="lista-compras-fundacao.xlsx"');

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body as ArrayBuffer);
    const ws = wb.getWorksheet("Lista de Compras")!;

    expect(ws.getCell("B3").value).toBe("Obra de Teste");
    expect(ws.getCell("B4").value).toBe("Fundação");

    // Itens na ordem de criação: o cimento (com código SINAPI e preço manual)
    // e a areia (pendente).
    const linhas = [8, 9].map((r) => ws.getRow(r));
    const cimento = linhas.find((l) => String(l.getCell(2).value).includes("Cimento"))!;
    const areia = linhas.find((l) => l.getCell(2).value === "Areia")!;
    expect(cimento.getCell(1).value).toBe("00001379");
    expect(cimento.getCell(5).value).toBe(7.5);
    expect(cimento.getCell(7).value).toBe("MANUAL");
    expect(areia.getCell(7).value).toBe("PENDENTE");
    expect(ws.getCell("F10").value).toMatchObject({ formula: "SUM(F8:F9)", result: 75 });
  });

  it("bloqueia exportação de lista de outro usuário (404)", async () => {
    const dono = await cenarioComLista("dono");
    const outro = await criarUsuarioAutenticado("outro");

    const res = await request(app)
      .get(`/api/listas-compras/${dono.listaId}/export.xlsx`)
      .set("Authorization", `Bearer ${outro.token}`);

    expect(res.status).toBe(404);
  });

  it("exige autenticação (401)", async () => {
    const { listaId } = await cenarioComLista("dono");

    const res = await request(app).get(`/api/listas-compras/${listaId}/export.xlsx`);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/listas-compras/:id/export.pdf", () => {
  it("exporta o PDF com headers HTTP e nome do arquivo pela etapa", async () => {
    const { token, listaId } = await cenarioComLista("dono");

    const res = await baixar(token, `/api/listas-compras/${listaId}/export.pdf`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toBe('attachment; filename="lista-compras-fundacao.pdf"');
    expect(Number(res.headers["content-length"])).toBe((res.body as Buffer).length);
    expect((res.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("gera a versão preto e branco com ?tema=pb (sufixo -pb no nome)", async () => {
    const { token, listaId } = await cenarioComLista("dono");

    const pdf = await baixar(token, `/api/listas-compras/${listaId}/export.pdf?tema=pb`);
    const xlsx = await baixar(token, `/api/listas-compras/${listaId}/export.xlsx?tema=pb`);

    expect(pdf.status).toBe(200);
    expect(pdf.headers["content-disposition"]).toBe('attachment; filename="lista-compras-fundacao-pb.pdf"');
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
    expect(xlsx.status).toBe(200);
    expect(xlsx.headers["content-disposition"]).toBe('attachment; filename="lista-compras-fundacao-pb.xlsx"');
  });

  it("recusa um tema desconhecido (400)", async () => {
    const { token, listaId } = await cenarioComLista("dono");

    const res = await request(app)
      .get(`/api/listas-compras/${listaId}/export.pdf?tema=sepia`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.issues[0]).toMatchObject({ campo: "tema" });
  });

  it("bloqueia exportação de lista de outro usuário (404)", async () => {
    const dono = await cenarioComLista("dono");
    const outro = await criarUsuarioAutenticado("outro");

    const res = await request(app)
      .get(`/api/listas-compras/${dono.listaId}/export.pdf`)
      .set("Authorization", `Bearer ${outro.token}`);

    expect(res.status).toBe(404);
  });
});
