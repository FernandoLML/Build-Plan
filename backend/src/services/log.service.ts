// Caminho: /backend/src/services/log.service.ts
// Leitura do Log de Rastreabilidade (RNF04) para a Tela 6.
// - Timeline por vínculo (ordem cronológica ascendente).
// - Visão agregada por obra (mais recentes primeiro).
// Ownership validado pela cadeia vínculo/obra -> usuário (404).

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";

// Projeção do executor exposta na API (nunca inclui o hash de senha).
const USUARIO_SELECT = { id: true, nome: true, email: true } as const;

export class LogService {
  /** Timeline de um vínculo específico, validando ownership (404). */
  public async listarPorVinculo(vinculoId: string, usuarioId: string) {
    const vinculo = await prisma.vinculoMaterialEtapa.findFirst({
      where: { id: vinculoId, etapa: { obra: { usuarioId } } },
      select: { id: true },
    });
    if (!vinculo) {
      throw new AppError("Vínculo não encontrado.", 404);
    }

    return prisma.logRastreabilidade.findMany({
      where: { vinculoId },
      orderBy: { criadoEm: "asc" }, // timeline imutável, do mais antigo ao mais novo
      include: { usuario: { select: USUARIO_SELECT } },
    });
  }

  /** Visão agregada de rastreabilidade da obra, validando ownership (404). */
  public async listarPorObra(obraId: string, usuarioId: string) {
    const obra = await prisma.obra.findFirst({
      where: { id: obraId, usuarioId },
      select: { id: true },
    });
    if (!obra) {
      throw new AppError("Obra não encontrada.", 404);
    }

    return prisma.logRastreabilidade.findMany({
      where: { vinculo: { etapa: { obraId } } },
      orderBy: { criadoEm: "desc" }, // auditoria: eventos mais recentes primeiro
      include: {
        usuario: { select: USUARIO_SELECT },
        vinculo: {
          select: {
            id: true,
            material: { select: { id: true, nome: true } },
            etapa: { select: { id: true, nome: true } },
          },
        },
      },
    });
  }
}

export const logService = new LogService();