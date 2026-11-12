// Caminho: /frontend/src/components/cronograma/TarefaItem.tsx
// Linha de tarefa: título, datas, badge e seletor rápido dos 4 status.

import type { ComponentType } from "react";
import { Ban, CheckCircle2, Circle, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { formatarData } from "@/lib/format";
import { estaAtrasada } from "@/lib/tarefas";
import { TarefaStatusBadge } from "./TarefaStatusBadge";
import {
  STATUS_TAREFA,
  STATUS_TAREFA_LABEL,
  type StatusTarefa,
  type Tarefa,
} from "@/types/tarefa";

const ICONE_STATUS: Record<StatusTarefa, ComponentType<{ className?: string }>> = {
  PENDENTE: Circle,
  EM_ANDAMENTO: PlayCircle,
  CONCLUIDA: CheckCircle2,
  BLOQUEADA: Ban,
};

const ATIVO_STATUS: Record<StatusTarefa, string> = {
  PENDENTE: "bg-slate-700 text-slate-100",
  EM_ANDAMENTO: "bg-indigo-600 text-white",
  CONCLUIDA: "bg-emerald-600 text-white",
  BLOQUEADA: "bg-rose-600 text-white",
};

interface TarefaItemProps {
  tarefa: Tarefa;
  onAlterarStatus: (status: StatusTarefa) => void;
  onEditar: () => void;
  onExcluir: () => void;
  desabilitado?: boolean;
}

export function TarefaItem({ tarefa, onAlterarStatus, onEditar, onExcluir, desabilitado }: TarefaItemProps) {
  const atrasada = estaAtrasada(tarefa);
  const concluida = tarefa.status === "CONCLUIDA";

  return (
    <li
      data-testid={`tarefa-${tarefa.id}`}
      className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-slate-800/30 md:flex-row md:items-center"
    >
      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`truncate text-sm font-medium ${concluida ? "text-slate-400 line-through" : "text-slate-100"}`}>
            {tarefa.titulo}
          </p>
          <TarefaStatusBadge status={tarefa.status} />
          {atrasada && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              Atrasada
            </span>
          )}
        </div>
        {tarefa.descricao && <p className="mt-0.5 truncate text-xs text-slate-500">{tarefa.descricao}</p>}
        <p className="mt-1 text-xs tabular-nums text-slate-500">
          Início: <span className="text-slate-400">{formatarData(tarefa.dataInicioPrev)}</span>
          {" · "}Término: <span className="text-slate-400">{formatarData(tarefa.dataFimPrev)}</span>
          {concluida && tarefa.dataConclusao && (
            <>
              {" · "}Concluída em:{" "}
              <span className="text-emerald-400">{formatarData(tarefa.dataConclusao)}</span>
            </>
          )}
        </p>
      </div>

      {/* Ações */}
      <div className="flex shrink-0 items-center gap-2">
        <div
          role="group"
          aria-label={`Alterar status de ${tarefa.titulo}`}
          className="inline-flex rounded-md border border-slate-800 bg-slate-950 p-0.5"
        >
          {STATUS_TAREFA.map((s) => {
            const Icone = ICONE_STATUS[s];
            const ativo = tarefa.status === s;
            return (
              <button
                key={s}
                type="button"
                title={STATUS_TAREFA_LABEL[s]}
                aria-label={`Marcar como ${STATUS_TAREFA_LABEL[s]}`}
                aria-pressed={ativo}
                disabled={desabilitado || ativo}
                onClick={() => onAlterarStatus(s)}
                className={`rounded p-1.5 transition-colors disabled:cursor-default ${
                  ativo ? ATIVO_STATUS[s] : "text-slate-500 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50"
                }`}
              >
                <Icone className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label={`Editar ${tarefa.titulo}`}
          title="Editar"
          onClick={onEditar}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Excluir ${tarefa.titulo}`}
          title="Excluir"
          onClick={onExcluir}
          disabled={desabilitado}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
