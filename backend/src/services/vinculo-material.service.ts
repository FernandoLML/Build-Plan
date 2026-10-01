// Caminho: /backend/src/services/vinculo-material.service.ts
// Regra de negócio do vínculo Material-Etapa (M4).
// - Ownership validado pela cadeia Material/Etapa -> Obra -> Usuario.
// - Máquina de estados RN01: PREVISTO -> RECEBIDO -> APLICADO.
// - Toda transição grava um LogRastreabilidade atomicamente ($transaction).

import { Prisma, StatusVinculo } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { CreateVinculoInput } from "../schemas/vinculo.schema.js";

// Transições permitidas pela RN01. Avançar apenas um passo por vez;
// não é permitido pular etapas nem retroceder.
const TRANSICOES_VALIDAS: Record<StatusVinculo, StatusVinculo[]> = {
  [StatusVinculo.PREVISTO]: [StatusVinculo.RECEBIDO],
  [StatusVinculo.RECEBIDO]: [StatusVinculo.APLICADO],
  [StatusVinculo.APLICADO]: [],
};

export class VinculoMaterialService {
  /** Busca um vínculo garantindo o ownership pela cadeia etapa -> obra. */
  private async buscarVinculoDoUsuario(vinculoId: string, usuarioId: string) {
    const vinculo = await prisma.vinculoMaterialEtapa.findFirst({
      where: { id: vinculoId, etapa: { obra: { usuarioId } } },
    });
    if (!vinculo) {
      throw new AppError("Vínculo não encontrado.", 404);
    }
    return vinculo;
  }

  /**
   * Vincula um material a uma etapa.
   * Valida que ambos pertencem ao usuário (404) e à MESMA obra (400),
   * e trata a duplicidade imposta por @@unique([materialId, etapaId]) (409).
   */
  public async criar(usuarioId: string, data: CreateVinculoInput) {
    const material = await prisma.material.findFirst({
      where: { id: data.materialId, obra: { usuarioId } },
      select: { id: true, obraId: true },
    });
    if (!material) {
      throw new AppError("Material não encontrado.", 404);
    }

    const etapa = await prisma.etapa.findFirst({
      where: { id: data.etapaId, obra: { usuarioId } },
      select: { id: true, obraId: true },
    });
    if (!etapa) {
      throw new AppError("Etapa não encontrada.", 404);
    }

    // Material e etapa precisam ser da mesma obra (regra de negócio).
    if (material.obraId !== etapa.obraId) {
      throw new AppError("Material e etapa devem pertencer à mesma obra.", 400);
    }

    // Duplicidade explícita (mensagem clara antes de depender do índice único).
    const existente = await prisma.vinculoMaterialEtapa.findUnique({
      where: { materialId_etapaId: { materialId: data.materialId, etapaId: data.etapaId } },
    });
    if (existente) {
      throw new AppError("Este material já está vinculado a esta etapa.", 409);
    }

    try {
      return await prisma.vinculoMaterialEtapa.create({
        data: {
          materialId: data.materialId,
          etapaId: data.etapaId,
          quantidade: new Prisma.Decimal(data.quantidade),
          local: data.local,
          // status assume o default PREVISTO definido no schema.
        },
      });
    } catch (err) {
      // Rede de segurança para corrida: viola o índice único composto.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError("Este material já está vinculado a esta etapa.", 409);
      }
      throw err;
    }
  }

  /** Lista os vínculos de uma etapa (validando ownership), com o material. */
  public async listarPorEtapa(etapaId: string, usuarioId: string) {
    const etapa = await prisma.etapa.findFirst({
      where: { id: etapaId, obra: { usuarioId } },
      select: { id: true },
    });
    if (!etapa) {
      throw new AppError("Etapa não encontrada.", 404);
    }

    return prisma.vinculoMaterialEtapa.findMany({
      where: { etapaId },
      orderBy: { createdAt: "asc" },
      include: { material: true },
    });
  }

  /**
   * Atualiza o status do vínculo seguindo a RN01, preenche a data correspondente
   * (recebimento/aplicação) e grava o log de rastreabilidade na MESMA transação.
   */
  public async atualizarStatus(
    vinculoId: string,
    usuarioId: string,
    novoStatus: StatusVinculo,
    detalhes?: string,
  ) {
    const vinculo = await this.buscarVinculoDoUsuario(vinculoId, usuarioId);
    const statusAtual = vinculo.status;

    if (statusAtual === novoStatus) {
      throw new AppError(`O vínculo já está no status ${novoStatus}.`, 400);
    }

    if (!TRANSICOES_VALIDAS[statusAtual].includes(novoStatus)) {
      throw new AppError(
        `Transição de status inválida: ${statusAtual} -> ${novoStatus}. ` +
          `Sequência permitida: PREVISTO -> RECEBIDO -> APLICADO.`,
        400,
      );
    }

    // Preenche a data do novo status, preservando uma data já existente.
    const patch: Prisma.VinculoMaterialEtapaUpdateInput = { status: novoStatus };
    if (novoStatus === StatusVinculo.RECEBIDO && !vinculo.dataRecebimento) {
      patch.dataRecebimento = new Date();
    }
    if (novoStatus === StatusVinculo.APLICADO && !vinculo.dataAplicacao) {
      patch.dataAplicacao = new Date();
    }

    // Atualização + log de auditoria de forma atômica (RNF04).
    return prisma.$transaction(async (tx) => {
      const atualizado = await tx.vinculoMaterialEtapa.update({
        where: { id: vinculoId },
        data: patch,
      });

      await tx.logRastreabilidade.create({
        data: {
          vinculoId,
          usuarioId,
          statusAnterior: statusAtual,
          statusNovo: novoStatus,
          detalhes,
        },
      });

      return atualizado;
    });
  }

  /** Remove um vínculo (validando ownership). */
  public async remover(vinculoId: string, usuarioId: string): Promise<void> {
    await this.buscarVinculoDoUsuario(vinculoId, usuarioId);
    await prisma.vinculoMaterialEtapa.delete({ where: { id: vinculoId } });
  }
}

export const vinculoMaterialService = new VinculoMaterialService();