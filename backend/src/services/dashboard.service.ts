// Caminho: /backend/src/services/dashboard.service.ts
// Indicadores agregados da obra (M5 — Workstream A).
// Foco primário: distribuição do ciclo de vida dos materiais (vínculos).
// Complementar: progresso físico de tarefas/etapas. Valores monetários em Decimal.

import { Prisma, StatusVinculo } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";

interface ContagemPercentual {
  quantidade: number;
  percentual: number; // 0–100
}

export interface DashboardObra {
  obraId: string;
  etapas: { total: number };
  materiais: { total: number };
  vinculos: {
    total: number;
    porStatus: Record<StatusVinculo, ContagemPercentual>;
  };
  progressoTarefas: {
    total: number;
    concluidas: number;
    percentual: number;
  };
  orcamento: {
    totalOrcado: string; // Decimal com 2 casas
    itensSemPreco: number;
  };
}

export class DashboardService {
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

  private static percentual(parte: number, total: number): number {
    return total === 0 ? 0 : Math.round((parte / total) * 100);
  }

  /** Monta os indicadores consolidados da obra. */
  public async getDashboard(obraId: string, usuarioId: string): Promise<DashboardObra> {
    await this.assertObraDoUsuario(obraId, usuarioId);

    // Consultas agregadas executadas em paralelo.
    const [
      totalEtapas,
      totalMateriais,
      grupos,
      totalTarefas,
      tarefasConcluidas,
      somaOrcado,
      itensSemPreco,
    ] = await Promise.all([
      prisma.etapa.count({ where: { obraId } }),
      prisma.material.count({ where: { obraId } }),
      prisma.vinculoMaterialEtapa.groupBy({
        by: ["status"],
        where: { etapa: { obraId } },
        _count: { _all: true },
      }),
      prisma.tarefa.count({ where: { etapa: { obraId } } }),
      prisma.tarefa.count({ where: { etapa: { obraId }, status: "CONCLUIDA" } }),
      prisma.itemCompra.aggregate({
        where: { listaCompras: { obraId } },
        _sum: { precoTotal: true },
      }),
      prisma.itemCompra.count({
        where: { listaCompras: { obraId }, precoTotal: null },
      }),
    ]);

    // Distribuição dos vínculos por status (preenchendo zeros ausentes).
    const contagemPorStatus: Record<StatusVinculo, number> = {
      [StatusVinculo.PREVISTO]: 0,
      [StatusVinculo.RECEBIDO]: 0,
      [StatusVinculo.APLICADO]: 0,
    };
    for (const grupo of grupos) {
      contagemPorStatus[grupo.status] = grupo._count._all;
    }
    const totalVinculos =
      contagemPorStatus.PREVISTO + contagemPorStatus.RECEBIDO + contagemPorStatus.APLICADO;

    const porStatus = {
      [StatusVinculo.PREVISTO]: {
        quantidade: contagemPorStatus.PREVISTO,
        percentual: DashboardService.percentual(contagemPorStatus.PREVISTO, totalVinculos),
      },
      [StatusVinculo.RECEBIDO]: {
        quantidade: contagemPorStatus.RECEBIDO,
        percentual: DashboardService.percentual(contagemPorStatus.RECEBIDO, totalVinculos),
      },
      [StatusVinculo.APLICADO]: {
        quantidade: contagemPorStatus.APLICADO,
        percentual: DashboardService.percentual(contagemPorStatus.APLICADO, totalVinculos),
      },
    };

    const totalOrcado = (somaOrcado._sum.precoTotal ?? new Prisma.Decimal(0)).toFixed(2);

    return {
      obraId,
      etapas: { total: totalEtapas },
      materiais: { total: totalMateriais },
      vinculos: { total: totalVinculos, porStatus },
      progressoTarefas: {
        total: totalTarefas,
        concluidas: tarefasConcluidas,
        percentual: DashboardService.percentual(tarefasConcluidas, totalTarefas),
      },
      orcamento: { totalOrcado, itensSemPreco },
    };
  }
}

export const dashboardService = new DashboardService();