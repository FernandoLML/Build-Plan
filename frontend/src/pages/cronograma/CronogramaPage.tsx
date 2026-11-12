// Caminho: /frontend/src/pages/cronograma/CronogramaPage.tsx
// Tela de Cronograma — etapas da obra com tarefas (M3) e progresso físico.

import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarraProgresso } from "@/components/dashboard/BarraProgresso";
import { EtapaTarefasCard } from "@/components/cronograma/EtapaTarefasCard";
import { EtapaFormDialog } from "@/components/materiais/EtapaFormDialog";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useEtapas } from "@/hooks/useMateriais";

export function CronogramaPage() {
  const { obraAtivaId } = useObraAtiva();
  const { data: etapas, isLoading, isError, refetch } = useEtapas(obraAtivaId);
  const [etapaFormOpen, setEtapaFormOpen] = useState(false);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
        <CalendarRange className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 font-medium text-slate-200">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para gerenciar o cronograma.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  const etapasOrdenadas = [...(etapas ?? [])].sort((a, b) => a.ordem - b.ordem);

  // Progresso físico global da obra (agregado das etapas; 0% se não houver tarefas).
  const total = etapasOrdenadas.reduce((acc, e) => acc + e.totalTarefas, 0);
  const concluidas = etapasOrdenadas.reduce((acc, e) => acc + e.tarefasConcluidas, 0);
  const percentual = total === 0 ? 0 : Math.round((concluidas / total) * 100);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">Cronograma</h1>
          <p className="text-sm text-slate-400">Tarefas por etapa e acompanhamento físico da obra.</p>
        </div>
        <Button onClick={() => setEtapaFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Nova etapa
        </Button>
      </header>

      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">Não foi possível carregar as etapas.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : etapasOrdenadas.length === 0 ? (
        !isError && (
          <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
            <CalendarRange className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 font-medium text-slate-200">Nenhuma etapa cadastrada</p>
            <p className="text-sm text-slate-500">Crie a primeira etapa para começar a planejar as tarefas.</p>
          </div>
        )
      ) : (
        <>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4" data-testid="progresso-obra">
            <BarraProgresso
              label="Progresso físico da obra"
              percentual={percentual}
              detalhe={`${concluidas} de ${total} tarefas concluídas • ${percentual}%`}
              cor={total > 0 && percentual === 100 ? "bg-emerald-500" : "bg-indigo-600"}
            />
          </div>
          <div className="space-y-4">
            {etapasOrdenadas.map((etapa) => (
              <EtapaTarefasCard key={etapa.id} etapa={etapa} obraId={obraAtivaId} />
            ))}
          </div>
        </>
      )}

      <EtapaFormDialog open={etapaFormOpen} onOpenChange={setEtapaFormOpen} obraId={obraAtivaId} />
    </div>
  );
}
