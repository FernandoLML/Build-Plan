// Caminho: /frontend/src/lib/tarefas.ts
// Regras puras de apresentação de tarefas: progresso físico e conversão de datas.

import type { CreateTarefaPayload, StatusTarefa, Tarefa, TarefaFormValues } from "@/types/tarefa";

export interface ProgressoFisico {
  total: number;
  concluidas: number;
  percentual: number; // 0–100, inteiro
}

/**
 * Progresso físico = tarefas CONCLUIDAS / total de tarefas.
 * Etapa sem tarefas → 0% (evita divisão por zero). Mesmo arredondamento do
 * backend (etapa.service.ts: Math.round).
 */
export function calcularProgresso(tarefas: ReadonlyArray<Pick<Tarefa, "status">>): ProgressoFisico {
  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.status === "CONCLUIDA").length;
  const percentual = total === 0 ? 0 : Math.round((concluidas / total) * 100);
  return { total, concluidas, percentual };
}

/**
 * Converte o valor de um <input type="date"> ("YYYY-MM-DD") em ISO 8601 aceito
 * pelo backend. Usa meio-dia UTC para que o dia não "volte" ao ser exibido em
 * fusos negativos (ex.: America/Sao_Paulo). Vazio → undefined.
 */
export function dataInputParaIso(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  return `${valor}T12:00:00.000Z`;
}

/** Converte uma data ISO da API no formato de <input type="date">. */
export function isoParaDataInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/** Monta o payload da API a partir do formulário (campos vazios são omitidos). */
export function montarPayloadTarefa(values: TarefaFormValues): CreateTarefaPayload {
  const payload: CreateTarefaPayload = { titulo: values.titulo.trim(), status: values.status };
  const descricao = values.descricao?.trim();
  if (descricao) payload.descricao = descricao;
  const inicio = dataInputParaIso(values.dataInicioPrev);
  if (inicio) payload.dataInicioPrev = inicio;
  const fim = dataInputParaIso(values.dataFimPrev);
  if (fim) payload.dataFimPrev = fim;
  return payload;
}

/** Tarefa atrasada: término previsto já passou e ainda não foi concluída. */
export function estaAtrasada(tarefa: Pick<Tarefa, "status" | "dataFimPrev">, hoje: Date = new Date()): boolean {
  if (tarefa.status === "CONCLUIDA" || !tarefa.dataFimPrev) return false;
  return tarefa.dataFimPrev.slice(0, 10) < hoje.toISOString().slice(0, 10);
}

/** Classes Tailwind (Obsidian Precision) por status de tarefa. */
export const STATUS_TAREFA_CLASSES: Record<StatusTarefa, string> = {
  PENDENTE: "bg-slate-800 text-slate-300",
  EM_ANDAMENTO: "bg-indigo-500/10 text-indigo-400",
  CONCLUIDA: "bg-emerald-500/10 text-emerald-400",
  BLOQUEADA: "bg-rose-500/10 text-rose-400",
};
