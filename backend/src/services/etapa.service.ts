// Caminho: /backend/src/services/etapa.service.ts
// Regra de negócio de Etapas (M3). Toda operação valida a propriedade da
// obra pai em relação ao usuário autenticado (Seção 6.1 do RFC).

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { CreateEtapaInput, UpdateEtapaInput } from "../schemas/etapa.schema.js";

interface EtapaComProgresso {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  obraId: string;
  totalTarefas: number;
  tarefasConcluidas: number;
  progresso: number; // 0–100 (%)
}

export class EtapaService {
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

  /** Busca uma etapa garantindo que sua obra pertence ao usuário. */
  private async buscarEtapaDoUsuario(etapaId: string, usuarioId: string) {
    const etapa = await prisma.etapa.findFirst({
      where: { id: etapaId, obra: { usuarioId } },
    });
    if (!etapa) {
      throw new AppError("Etapa não encontrada.", 404);
    }
    return etapa;
  }

  /** Cria uma etapa na obra informada (validando ownership). */
  public async criar(obraId: string, usuarioId: string, data: CreateEtapaInput) {
    await this.assertObraDoUsuario(obraId, usuarioId);

    return prisma.etapa.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        ordem: data.ordem ?? 0,
        obraId,
      },
    });
  }

  /**
   * Lista as etapas de uma obra com o progresso percentual calculado
   * a partir das tarefas concluídas.
   */
  public async listarPorObra(obraId: string, usuarioId: string): Promise<EtapaComProgresso[]> {
    await this.assertObraDoUsuario(obraId, usuarioId);

    const etapas = await prisma.etapa.findMany({
      where: { obraId },
      orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
      include: {
        tarefas: { select: { status: true } },
      },
    });

    return etapas.map((etapa): EtapaComProgresso => {
      const total = etapa.tarefas.length;
      const concluidas = etapa.tarefas.filter(
        (t: { status: string }) => t.status === "CONCLUIDA",
      ).length;
      const progresso = total === 0 ? 0 : Math.round((concluidas / total) * 100);

      return {
        id: etapa.id,
        nome: etapa.nome,
        descricao: etapa.descricao,
        ordem: etapa.ordem,
        obraId: etapa.obraId,
        totalTarefas: total,
        tarefasConcluidas: concluidas,
        progresso,
      };
    });
  }

  /** Atualiza uma etapa (validando ownership da obra pai). */
  public async atualizar(etapaId: string, usuarioId: string, data: UpdateEtapaInput) {
    await this.buscarEtapaDoUsuario(etapaId, usuarioId);

    return prisma.etapa.update({
      where: { id: etapaId },
      data,
    });
  }

  /** Remove uma etapa (validando ownership da obra pai). */
  public async remover(etapaId: string, usuarioId: string): Promise<void> {
    await this.buscarEtapaDoUsuario(etapaId, usuarioId);
    await prisma.etapa.delete({ where: { id: etapaId } });
  }
}

export const etapaService = new EtapaService();