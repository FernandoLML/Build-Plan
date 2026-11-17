// Caminho: /backend/src/services/recuperacao-senha.service.ts
// "Esqueci minha senha": gera um token de uso único, envia o link por e-mail
// e troca a senha quando o token é apresentado.
//
// Decisões de segurança:
//  - a resposta do pedido é sempre a mesma, exista o e-mail ou não (não revela
//    quem tem conta);
//  - o banco guarda só o hash SHA-256 do token; o valor real existe apenas no
//    link enviado;
//  - o token vale 30 minutos e é apagado ao ser usado; um novo pedido invalida
//    os anteriores.

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { env } from "../config/env.js";
import { BCRYPT_COST } from "./auth.service.js";
import { emailService } from "./email.service.js";

export const VALIDADE_TOKEN_MINUTOS = 30;

const MENSAGEM_TOKEN_INVALIDO = "Link de redefinição inválido ou expirado. Solicite um novo.";

/** Hash do token como é guardado no banco. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Link que o usuário recebe por e-mail (rota do frontend). */
export function montarLinkRedefinicao(token: string, frontendUrl = env.FRONTEND_URL): string {
  return `${frontendUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
}

export class RecuperacaoSenhaService {
  /**
   * Registra o pedido e dispara o e-mail. Não lança erro nem devolve nada que
   * indique se o e-mail está cadastrado.
   */
  public async solicitar(email: string): Promise<void> {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true },
    });
    if (!usuario) return;

    // 32 bytes aleatórios (256 bits): inviável de adivinhar.
    const token = randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + VALIDADE_TOKEN_MINUTOS * 60 * 1000);

    await prisma.$transaction([
      prisma.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: usuario.id } }),
      prisma.tokenRedefinicaoSenha.create({
        data: { usuarioId: usuario.id, tokenHash: hashToken(token), expiraEm },
      }),
    ]);

    // Sem `await`: o tempo de resposta não depende do servidor de e-mail, o
    // que evitaria distinguir, pela demora, um e-mail cadastrado de um não
    // cadastrado. Uma falha de envio é registrada e não chega ao cliente.
    emailService
      .enviar({
        para: usuario.email,
        assunto: "Build-Plan: redefinição de senha",
        texto: [
          `Olá, ${usuario.nome}.`,
          "",
          "Recebemos um pedido para redefinir a senha da sua conta no Build-Plan.",
          `Para escolher uma nova senha, acesse o link abaixo em até ${VALIDADE_TOKEN_MINUTOS} minutos:`,
          "",
          montarLinkRedefinicao(token),
          "",
          "Se você não fez esse pedido, ignore este e-mail: sua senha continua a mesma.",
        ].join("\n"),
      })
      .catch((err: unknown) => {
        console.error("[email] Falha ao enviar a redefinição de senha:", err);
      });
  }

  /** Troca a senha a partir de um token válido e invalida todos os tokens do usuário. */
  public async redefinir(token: string, novaSenha: string): Promise<void> {
    const registro = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!registro || registro.expiraEm.getTime() <= Date.now()) {
      throw new AppError(MENSAGEM_TOKEN_INVALIDO, 400);
    }

    const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_COST);

    await prisma.$transaction([
      prisma.usuario.update({ where: { id: registro.usuarioId }, data: { senhaHash } }),
      prisma.tokenRedefinicaoSenha.deleteMany({ where: { usuarioId: registro.usuarioId } }),
    ]);
  }
}

export const recuperacaoSenhaService = new RecuperacaoSenhaService();
