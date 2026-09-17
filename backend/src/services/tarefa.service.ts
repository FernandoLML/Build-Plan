// Caminho: /backend/src/services/tarefa.service.ts
// Regra de negócio de Tarefas (M3). Ownership validado através da cadeia
// Tarefa -> Etapa -> Obra -> Usuario.

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { CreateTarefaInput, UpdateTarefaInput } from "../schemas/tarefa.schema.js";

export class TarefaService {
  /** Garante que a etapa existe e pertence a uma obra do usuário. */
  private async assertEtapaDoUsuario(etapaId: string, usuarioId: string): Promise<void> {
    const etapa = await prisma.etapa.findFirst({
      where: { id: etapaId, obra: { usuarioId } },
      select: { id: true },
    });
    if (!etapa) {
      throw new AppError("Etapa não encontrada.", 404);
    }
  }

  /** Busca uma tarefa garantindo o ownership pela cadeia etapa -> obra. */
  private async buscarTarefaDoUsuario(tarefaId: string, usuarioId: string) {
    const tarefa = await prisma.tarefa.findFirst({
      where: { id: tarefaId, etapa: { obra: { usuarioId } } },
    });
    if (!tarefa) {
      throw new AppError("Tarefa não encontrada.", 404);
    }
    return tarefa;
  }

  /** Cria uma tarefa na etapa informada (validando ownership). */
  public async criar(etapaId: string, usuarioId: string, data: CreateTarefaInput) {
    await this.assertEtapaDoUsuario(etapaId, usuarioId);

    return prisma.tarefa.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        status: data.status,
        dataInicioPrev: data.dataInicioPrev,
        dataFimPrev: data.dataFimPrev,
        dataConclusao: data.dataConclusao,
        ordem: data.ordem ?? 0,
        etapaId,
      },
    });
  }

  /** Lista as tarefas de uma etapa (validando ownership), ordenadas. */
  public async listarPorEtapa(etapaId: string, usuarioId: string) {
    await this.assertEtapaDoUsuario(etapaId, usuarioId);

    return prisma.tarefa.findMany({
      where: { etapaId },
      orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
    });
  }

  /** Retorna uma tarefa do usuário. */
  public async buscarPorId(tarefaId: string, usuarioId: string) {
    return this.buscarTarefaDoUsuario(tarefaId, usuarioId);
  }

  /**
   * Atualiza status e/ou datas de uma tarefa.
   * Regra: ao concluir (status CONCLUIDA) sem informar dataConclusao,
   * ela é preenchida automaticamente com o momento atual.
   */
  public async atualizar(tarefaId: string, usuarioId: string, data: UpdateTarefaInput) {
    await this.buscarTarefaDoUsuario(tarefaId, usuarioId);

    const dataConclusao =
      data.status === "CONCLUIDA" && !data.dataConclusao
        ? new Date()
        : data.dataConclusao;

    return prisma.tarefa.update({
      where: { id: tarefaId },
      data: { ...data, dataConclusao },
    });
  }

  /** Remove uma tarefa (validando ownership). */
  public async remover(tarefaId: string, usuarioId: string): Promise<void> {
    await this.buscarTarefaDoUsuario(tarefaId, usuarioId);
    await prisma.tarefa.delete({ where: { id: tarefaId } });
  }
}

export const tarefaService = new TarefaService();