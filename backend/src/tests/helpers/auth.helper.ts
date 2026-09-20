// Caminho: /backend/src/tests/helpers/auth.helper.ts
// Helpers de autenticação reutilizados pelas suítes de integração.
// Registram usuários reais via API e devolvem tokens JWT válidos, permitindo
// simular requisições de múltiplos usuários com o Supertest.

import request from "supertest";
import { app } from "../../app.js";

export interface UsuarioAutenticado {
  token: string;
  usuarioId: string;
  email: string;
}

/**
 * Registra um usuário pela rota real (/api/auth/register) e devolve o token
 * JWT e o id. Cada chamada usa um e-mail único para isolar os usuários.
 */
export async function criarUsuarioAutenticado(
  sufixo = "user",
): Promise<UsuarioAutenticado> {
  const email = `${sufixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@buildplan.test`;

  const res = await request(app).post("/api/auth/register").send({
    nome: `Usuário ${sufixo}`,
    email,
    senha: "senhaForte123",
  });

  return {
    token: res.body.token as string,
    usuarioId: res.body.usuario.id as string,
    email,
  };
}

/** Cria uma obra para o usuário do token informado e devolve o id da obra. */
export async function criarObra(token: string, nome = "Obra de Teste"): Promise<string> {
  const res = await request(app)
    .post("/api/obras")
    .set("Authorization", `Bearer ${token}`)
    .send({ nome });

  return res.body.id as string;
}

/** Cria uma etapa em uma obra e devolve o id da etapa. */
export async function criarEtapa(
  token: string,
  obraId: string,
  nome = "Fundação",
  ordem = 0,
): Promise<string> {
  const res = await request(app)
    .post(`/api/obras/${obraId}/etapas`)
    .set("Authorization", `Bearer ${token}`)
    .send({ nome, ordem });

  return res.body.id as string;
}