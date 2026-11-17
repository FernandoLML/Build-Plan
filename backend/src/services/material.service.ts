// Caminho: /backend/src/services/material.service.ts
// Regra de negócio do catálogo de Materiais (M4). Toda operação valida a
// propriedade da obra em relação ao usuário autenticado (Seção 6.1 do RFC).

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { CreateMaterialInput, UpdateMaterialInput } from "../schemas/material.schema.js";
import { travarMaterial, somarVinculado, formatarQuantidade } from "./material-saldo.js";

export class MaterialService {
  /** Garante que a obra existe e pertence ao usuário. Lança 404 caso contrário. */
  private async assertObraDoUsuario(obraId: string, usuarioId: string): Promise<void> {
    const obra = await prisma.obra.findFirst({
      where: { id: obraId, usuarioId },
      select: { id: true },
    });
    if (!obra) {
      throw new AppError("Obra não encontrada.", 404);
    }
  }

  /** Busca um material garantindo que sua obra pertence ao usuário. */
  private async buscarMaterialDoUsuario(materialId: string, usuarioId: string) {
    const material = await prisma.material.findFirst({
      where: { id: materialId, obra: { usuarioId } },
    });
    if (!material) {
      throw new AppError("Material não encontrado.", 404);
    }
    return material;
  }

  /** Cria um material no catálogo da obra (validando ownership). */
  public async criar(obraId: string, usuarioId: string, data: CreateMaterialInput) {
    await this.assertObraDoUsuario(obraId, usuarioId);

    return prisma.material.create({
      data: {
        nome: data.nome,
        especificacao: data.especificacao,
        unidade: data.unidade,
        // Decimal do Prisma: evita imprecisão de ponto flutuante em quantidades.
        quantidade: new Prisma.Decimal(data.quantidade ?? 0),
        origem: data.origem,
        codigoSinapi: data.codigoSinapi,
        obraId,
      },
    });
  }

  /** Lista os materiais de uma obra (validando ownership). */
  public async listarPorObra(obraId: string, usuarioId: string) {
    await this.assertObraDoUsuario(obraId, usuarioId);

    return prisma.material.findMany({
      where: { obraId },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Retorna um material do usuário. */
  public async buscarPorId(materialId: string, usuarioId: string) {
    return this.buscarMaterialDoUsuario(materialId, usuarioId);
  }

  /**
   * Atualiza um material (validando ownership). A quantidade não pode ficar
   * abaixo do que já está vinculado às etapas (400): o vínculo ficaria maior
   * que o material.
   */
  public async atualizar(materialId: string, usuarioId: string, data: UpdateMaterialInput) {
    const material = await this.buscarMaterialDoUsuario(materialId, usuarioId);
    const quantidade = data.quantidade === undefined ? undefined : new Prisma.Decimal(data.quantidade);

    return prisma.$transaction(async (tx) => {
      if (quantidade !== undefined) {
        await travarMaterial(tx, materialId);
        const vinculado = await somarVinculado(tx, materialId);
        if (quantidade.lt(vinculado)) {
          const un = data.unidade ?? material.unidade;
          throw new AppError(
            `A quantidade não pode ser menor que o total já vinculado às etapas ` +
              `(${formatarQuantidade(vinculado)} ${un}). Remova ou reduza vínculos antes.`,
            400,
          );
        }
      }

      return tx.material.update({
        where: { id: materialId },
        data: {
          nome: data.nome,
          especificacao: data.especificacao,
          unidade: data.unidade,
          quantidade,
          origem: data.origem,
          codigoSinapi: data.codigoSinapi,
        },
      });
    });
  }

  /** Remove um material (validando ownership). */
  public async remover(materialId: string, usuarioId: string): Promise<void> {
    await this.buscarMaterialDoUsuario(materialId, usuarioId);
    await prisma.material.delete({ where: { id: materialId } });
  }
}

export const materialService = new MaterialService();