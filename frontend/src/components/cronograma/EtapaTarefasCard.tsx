// Caminho: /frontend/src/components/cronograma/EtapaTarefasCard.tsx
// Card de uma etapa no cronograma: progresso físico + lista de tarefas com CRUD
// e alternância rápida de status.

import { useState } from "react";
import { ChevronDown, ChevronRight, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarraProgresso } from "@/components/dashboard/BarraProgresso";
import {
  useAlterarStatusTarefa,
  useExcluirTarefa,
  useTarefas,
} from "@/hooks/useTarefas";
import { calcularProgresso } from "@/lib/tarefas";
import type { EtapaComProgresso } from "@/types/etapa";
import type { Tarefa } from "@/types/tarefa";
import { TarefaFormDialog } from "./TarefaFormDialog";
import { TarefaItem } from "./TarefaItem";

interface EtapaTarefasCardProps {
  etapa: EtapaComProgresso;
  obraId: string;
  defaultAberta?: boolean;
}

export function EtapaTarefasCard({ etapa, obraId, defaultAberta = true }: EtapaTarefasCardProps) {
  const [aberta, setAberta] = useState(defaultAberta);
  const [formOpen, setFormOpen] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Tarefa | null>(null);

  const { data: tarefas, isLoading, isError, refetch } = useTarefas(etapa.id);
  const alterarStatus = useAlterarStatusTarefa(etapa.id, obraId);
  const excluir = useExcluirTarefa(etapa.id, obraId);

  // Lista carregada → progresso "ao vivo" (inclui atualizações otimistas);
  // caso contrário, usa o agregado do backend vindo de GET /obras/:id/etapas.
  const progresso = tarefas
    ? calcularProgresso(tarefas)
    : { total: etapa.totalTarefas, concluidas: etapa.tarefasConcluidas, percentual: etapa.progresso };
  const completa = progresso.total > 0 && progresso.percentual === 100;
  const detalhe =
    progresso.total === 0
      ? "Sem tarefas • 0%"
      : `${progresso.concluidas} de ${progresso.total} tarefas concluídas • ${progresso.percentual}%`;

  function abrirCriacao() {
    setEmEdicao(null);
    setFormOpen(true);
  }

  function abrirEdicao(tarefa: Tarefa) {
    setEmEdicao(tarefa);
    setFormOpen(true);
  }

  function handleExcluir(tarefa: Tarefa) {
    if (window.confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) {
      excluir.mutate(tarefa.id);
    }
  }

  const ocupada = (id: string) =>
    (alterarStatus.isPending && alterarStatus.variables?.id === id) ||
    (excluir.isPending && excluir.variables === id);

  const listaId = `etapa-${etapa.id}-tarefas`;

  return (
    <section
      aria-labelledby={`etapa-${etapa.id}-titulo`}
      className="rounded-lg border border-slate-800 bg-slate-900"
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <button
          type="button"
          onClick={() => setAberta((v) => !v)}
          aria-expanded={aberta}
          aria-controls={listaId}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          {aberta ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
          )}
          <h2 id={`etapa-${etapa.id}-titulo`} className="truncate font-display text-base font-semibold text-slate-100">
            {etapa.nome}
          </h2>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs tabular-nums text-slate-400">
            {progresso.total}
          </span>
        </button>
        <Button size="sm" variant="outline" onClick={abrirCriacao}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Nova tarefa
        </Button>
      </div>

      {/* Progresso físico */}
      <div className="px-4 py-3" data-testid={`progresso-${etapa.id}`}>
        <BarraProgresso
          label="Progresso físico"
          percentual={progresso.percentual}
          detalhe={detalhe}
          cor={completa ? "bg-emerald-500" : "bg-indigo-600"}
        />
      </div>

      {/* Lista */}
      {aberta && (
        <div id={listaId} className="border-t border-slate-800">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-4 text-center">
              <p className="text-sm text-red-400">Não foi possível carregar as tarefas.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : !tarefas || tarefas.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <ListChecks className="h-6 w-6 text-slate-600" />
              <p className="text-sm text-slate-400">Nenhuma tarefa nesta etapa.</p>
              <p className="text-xs text-slate-500">Crie tarefas para acompanhar o avanço físico.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {tarefas.map((t) => (
                <TarefaItem
                  key={t.id}
                  tarefa={t}
                  desabilitado={ocupada(t.id)}
                  onAlterarStatus={(status) => alterarStatus.mutate({ id: t.id, status })}
                  onEditar={() => abrirEdicao(t)}
                  onExcluir={() => handleExcluir(t)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <TarefaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        etapaId={etapa.id}
        obraId={obraId}
        tarefa={emEdicao}
      />
    </section>
  );
}
