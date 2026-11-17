// Caminho: /backend/src/services/conta.service.ts
// Direitos do titular previstos na LGPD (RFC §6.2): corrigir os próprios dados
// e excluir a conta com tudo o que está vinculado a ela.

import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { AtualizarPerfilInput } from "../schemas/auth.schema.js";

const PERFIL_PUBLICO = { id: true, nome: true, email: true, papel: true } as const;

export class ContaService {
  /** Atualiza nome e/ou e-mail do usuário autenticado. */
  public async atualizarPerfil(usuarioId: string, data: AtualizarPerfilInput) {
    if (data.email) {
      const outro = await prisma.usuario.findFirst({
        where: { email: data.email, NOT: { id: usuarioId } },
        select: { id: true },
      });
      if (outro) {
        throw new AppError("E-mail já cadastrado.", 409);
      }
    }

    try {
      return await prisma.usuario.update({
        where: { id: usuarioId },
        data,
        select: PERFIL_PUBLICO,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Rede de segurança para corrida: outro cadastro pegou o e-mail.
        if (err.code === "P2002") throw new AppError("E-mail já cadastrado.", 409);
        // Token ainda válido de uma conta que já foi excluída.
        if (err.code === "P2025") throw new AppError("Usuário não encontrado.", 404);
      }
      throw err;
    }
  }

  /**
   * Exclui a conta e todos os dados vinculados, exigindo a senha atual.
   *
   * A ordem importa: `log_rastreabilidade.usuario_id` é ON DELETE RESTRICT
   * (um log nunca fica sem autor), então apagar o usuário direto falharia
   * enquanto houvesse logs. Apagar as obras primeiro leva, em cascata, etapas,
   * materiais, vínculos, logs e listas de compras.
   */
  public async excluirConta(usuarioId: string, senha: string): Promise<void> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, senhaHash: true },
    });
    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    // 400 (e não 401): o token é válido, o que está errado é a confirmação.
    const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw new AppError("Senha incorreta.", 400);
    }

    await prisma.$transaction([
      prisma.obra.deleteMany({ where: { usuarioId } }),
      prisma.logRastreabilidade.deleteMany({ where: { usuarioId } }),
      prisma.usuario.delete({ where: { id: usuarioId } }),
    ]);
  }
}

export const contaService = new ContaService();
