// Caminho: /backend/src/services/obra.service.ts
// Camada de negócio. Consome o Prisma Client e aplica a verificação de
// propriedade do recurso (Seção 6.1 do RFC): cada usuário só acessa suas obras.

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { CreateObraInput, UpdateObraInput } from "../schemas/obra.schema.js";

export class ObraService {
  /** Lista todas as obras pertencentes ao usuário autenticado. */
  public async listar(usuarioId: string) {
    return prisma.obra.findMany({
      where: { usuarioId },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Busca uma obra por id, garantindo que pertença ao usuário. */
  public async buscarPorId(id: string, usuarioId: string) {
    const obra = await prisma.obra.findFirst({
      where: { id, usuarioId },
    });

    if (!obra) {
      throw new AppError("Obra não encontrada.", 404);
    }

    return obra;
  }

  /** Cria uma nova obra vinculada ao usuário. */
  public async criar(usuarioId: string, data: CreateObraInput) {
    return prisma.obra.create({
      data: { ...data, usuarioId },
    });
  }

  /** Atualiza uma obra existente após validar a propriedade. */
  public async atualizar(id: string, usuarioId: string, data: UpdateObraInput) {
    await this.buscarPorId(id, usuarioId); // valida existência + propriedade

    return prisma.obra.update({
      where: { id },
      data,
    });
  }

  /** Remove uma obra após validar a propriedade. */
  public async remover(id: string, usuarioId: string): Promise<void> {
    await this.buscarPorId(id, usuarioId); // valida existência + propriedade

    await prisma.obra.delete({ where: { id } });
  }
}

export const obraService = new ObraService();