// Caminho: /backend/src/tests/conta.spec.ts
// Direitos do titular (LGPD, RFC §6.2): consentimento no cadastro, correção
// dos dados (PUT /api/auth/me) e exclusão da conta (DELETE /api/auth/me).

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

const SENHA = "senhaForte123"; // a mesma usada por criarUsuarioAutenticado

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("Consentimento no cadastro", () => {
  const cadastro = { nome: "Maria Souza", email: "maria@buildplan.test", senha: SENHA };

  it("recusa o cadastro sem o aceite da Política de Privacidade (400)", async () => {
    const semCampo = await request(app).post("/api/auth/register").send(cadastro);
    const recusado = await request(app)
      .post("/api/auth/register")
      .send({ ...cadastro, aceitePrivacidade: false });

    expect(semCampo.status).toBe(400);
    expect(recusado.status).toBe(400);
    expect(recusado.body.issues[0]).toMatchObject({
      campo: "aceitePrivacidade",
      mensagem: expect.stringMatching(/política de privacidade/i),
    });
    expect(await prisma.usuario.count()).toBe(0);
  });

  it("registra a data do consentimento ao cadastrar", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...cadastro, aceitePrivacidade: true });

    expect(res.status).toBe(201);
    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email: cadastro.email } });
    expect(usuario.consentimentoEm).toBeInstanceOf(Date);
  });
});

describe("PUT /api/auth/me", () => {
  it("atualiza nome e e-mail (normalizando o e-mail)", async () => {
    const { token } = await criarUsuarioAutenticado("perfil");

    const res = await request(app)
      .put("/api/auth/me")
      .set(auth(token))
      .send({ nome: "Nome Corrigido", email: "  NOVO@BuildPlan.test " });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: "Nome Corrigido", email: "novo@buildplan.test" });
    expect(res.body).not.toHaveProperty("senhaHash");
  });

  it("permite reenviar o próprio e-mail sem acusar duplicidade", async () => {
    const { token, email } = await criarUsuarioAutenticado("perfil");

    const res = await request(app).put("/api/auth/me").set(auth(token)).send({ email });

    expect(res.status).toBe(200);
  });

  it("bloqueia e-mail já usado por outra conta (409)", async () => {
    const a = await criarUsuarioAutenticado("a");
    const b = await criarUsuarioAutenticado("b");

    const res = await request(app).put("/api/auth/me").set(auth(b.token)).send({ email: a.email });

    expect(res.status).toBe(409);
  });

  it("rejeita corpo vazio e nome curto (400)", async () => {
    const { token } = await criarUsuarioAutenticado("perfil");

    expect((await request(app).put("/api/auth/me").set(auth(token)).send({})).status).toBe(400);
    expect(
      (await request(app).put("/api/auth/me").set(auth(token)).send({ nome: "x" })).status,
    ).toBe(400);
  });

  it("exige autenticação (401)", async () => {
    const res = await request(app).put("/api/auth/me").send({ nome: "Sem Token" });
    expect(res.status).toBe(401);
  });

  it("responde 404 se a conta do token já não existe", async () => {
    const { token, usuarioId } = await criarUsuarioAutenticado("perfil");
    await prisma.usuario.delete({ where: { id: usuarioId } });

    const res = await request(app).put("/api/auth/me").set(auth(token)).send({ nome: "Fantasma" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/auth/me", () => {
  it("exclui a conta e todos os dados vinculados, inclusive logs de rastreabilidade", async () => {
    const { token, usuarioId, email } = await criarUsuarioAutenticado("sair");
    const obraId = await criarObra(token);
    const etapaId = await criarEtapa(token, obraId);
    const materialId = await criarMaterial(token, obraId);
    const vinculo = await request(app)
      .post(`/api/etapas/${etapaId}/materiais`)
      .set(auth(token))
      .send({ materialId, quantidade: 5 });
    // Gera um log: é ele que impediria apagar o usuário diretamente (RESTRICT).
    await request(app)
      .patch(`/api/vinculos/${vinculo.body.id}/status`)
      .set(auth(token))
      .send({ status: "RECEBIDO" });
    await request(app).post(`/api/etapas/${etapaId}/lista-compras`).set(auth(token));
    expect(await prisma.logRastreabilidade.count({ where: { usuarioId } })).toBe(1);

    const res = await request(app).delete("/api/auth/me").set(auth(token)).send({ senha: SENHA });

    expect(res.status).toBe(204);
    expect(await prisma.usuario.count({ where: { id: usuarioId } })).toBe(0);
    expect(await prisma.obra.count()).toBe(0);
    expect(await prisma.material.count()).toBe(0);
    expect(await prisma.vinculoMaterialEtapa.count()).toBe(0);
    expect(await prisma.logRastreabilidade.count()).toBe(0);
    expect(await prisma.listaCompras.count()).toBe(0);

    const login = await request(app).post("/api/auth/login").send({ email, senha: SENHA });
    expect(login.status).toBe(401);
  });

  it("não toca nos dados de outros usuários", async () => {
    const saindo = await criarUsuarioAutenticado("sair");
    const ficando = await criarUsuarioAutenticado("ficar");
    await criarObra(saindo.token);
    const obraQueFica = await criarObra(ficando.token);

    await request(app).delete("/api/auth/me").set(auth(saindo.token)).send({ senha: SENHA });

    const obras = await prisma.obra.findMany();
    expect(obras.map((o) => o.id)).toEqual([obraQueFica]);
  });

  it("recusa com a senha errada (400) e mantém a conta", async () => {
    const { token, usuarioId } = await criarUsuarioAutenticado("sair");

    const res = await request(app)
      .delete("/api/auth/me")
      .set(auth(token))
      .send({ senha: "senha-errada-999" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/senha incorreta/i);
    expect(await prisma.usuario.count({ where: { id: usuarioId } })).toBe(1);
  });

  it("exige a senha no corpo (400) e autenticação (401)", async () => {
    const { token } = await criarUsuarioAutenticado("sair");

    expect((await request(app).delete("/api/auth/me").set(auth(token)).send({})).status).toBe(400);
    expect((await request(app).delete("/api/auth/me").send({ senha: SENHA })).status).toBe(401);
  });

  it("responde 404 se a conta do token já não existe", async () => {
    const { token, usuarioId } = await criarUsuarioAutenticado("sair");
    await prisma.usuario.delete({ where: { id: usuarioId } });

    const res = await request(app).delete("/api/auth/me").set(auth(token)).send({ senha: SENHA });

    expect(res.status).toBe(404);
  });
});
