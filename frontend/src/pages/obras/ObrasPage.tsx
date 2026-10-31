// Caminho: /frontend/src/pages/obras/ObrasPage.tsx
// Tela 1 — Gestão de Obras (RFC 4.1). Grid de cards + card pontilhado de criação.

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useObras, useExcluirObra } from "@/hooks/useObras";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useVinculosDaObra } from "@/hooks/useMateriais";
import { ObraCard } from "@/components/obras/ObraCard";
import { ObraFormDialog } from "@/components/obras/ObraFormDialog";
import type { Obra } from "@/types/obra";

export function ObrasPage() {
  const { data: obras, isLoading, isError, refetch } = useObras();
  const { obraAtivaId, selecionarObra } = useObraAtiva();
  const excluir = useExcluirObra();

  // Progresso de suprimentos disponível apenas para a obra ativa (dados em cache).
  const { vinculos } = useVinculosDaObra(obraAtivaId);
  const progressoAtiva = (() => {
    const total = vinculos.length;
    if (total === 0) return 0;
    const aplicados = vinculos.filter((v) => v.status === "APLICADO").length;
    return Math.round((aplicados / total) * 100);
  })();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [obraEmEdicao, setObraEmEdicao] = useState<Obra | null>(null);

  function abrirCriacao() {
    setObraEmEdicao(null);
    setDialogOpen(true);
  }

  function handleExcluir(obra: Obra) {
    if (window.confirm(`Excluir a obra "${obra.nome}"? Esta ação não pode ser desfeita.`)) {
      excluir.mutate(obra.id);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">Minhas Obras</h1>
          <p className="text-sm text-slate-400">Selecione uma obra para gerenciar etapas, materiais e compras.</p>
        </div>
        <Button onClick={abrirCriacao}>
          <Plus className="mr-1 h-4 w-4" /> Nova obra
        </Button>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando obras…
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">Não foi possível carregar as obras.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && !isError && obras && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {obras.map((obra) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              ativa={obra.id === obraAtivaId}
              progresso={obra.id === obraAtivaId ? progressoAtiva : null}
              onSelecionar={(o) => selecionarObra(o.id)}
              onEditar={(o) => {
                setObraEmEdicao(o);
                setDialogOpen(true);
              }}
              onExcluir={handleExcluir}
            />
          ))}

          {/* Card pontilhado — cadastrar nova obra */}
          <button
            onClick={abrirCriacao}
            className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 text-slate-500 transition-colors hover:border-indigo-500 hover:text-indigo-400"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Cadastrar nova obra</span>
          </button>
        </div>
      )}

      <ObraFormDialog open={dialogOpen} onOpenChange={setDialogOpen} obra={obraEmEdicao} />
    </div>
  );
}