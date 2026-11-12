// Caminho: /backend/src/services/tarefa.service.ts
// Regra de negócio de Tarefas (M3). Ownership validado através da cadeia
// Tarefa -> Etapa -> Obra -> Usuario.

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { CreateTarefaInput, UpdateTarefaInput } from "../schemas/tarefa.schema.js";

type StatusTarefa = NonNullable<CreateTarefaInput["status"]>;

/**
 * Resolve a dataConclusao a gravar a partir do status final da tarefa.
 * Invariantes:
 *  - tarefa CONCLUIDA sempre tem dataConclusao (preenchida com "agora" se
 *    não informada e ainda não existir — reenviar CONCLUIDA não a sobrescreve);
 *  - ao sair de CONCLUIDA para outro status, dataConclusao é limpa (null).
 * Retorna `undefined` quando o campo não deve ser alterado.
 */
export function resolverDataConclusao(
  statusAnterior: StatusTarefa | null,
  statusFinal: StatusTarefa,
  informada: Date | null | undefined,
  atual: Date | null,
): Date | null | undefined {
  if (statusFinal === "CONCLUIDA") {
    if (informada) return informada;
    if (informada === null || !atual) return new Date();
    return undefined;
  }
  if (statusAnterior === "CONCLUIDA") return null;
  return informada;
}

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
        dataConclusao: resolverDataConclusao(
          null,
          data.status ?? "PENDENTE",
          data.dataConclusao,
          null,
        ),
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
   * Atualiza campos de uma tarefa. Campos `null` são limpos (ex.: datas).
   * Regras de dataConclusao: ver resolverDataConclusao (preenche ao concluir,
   * limpa ao reabrir).
   */
  public async atualizar(tarefaId: string, usuarioId: string, data: UpdateTarefaInput) {
    const atual = await this.buscarTarefaDoUsuario(tarefaId, usuarioId);

    const dataConclusao = resolverDataConclusao(
      atual.status,
      data.status ?? atual.status,
      data.dataConclusao,
      atual.dataConclusao,
    );

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