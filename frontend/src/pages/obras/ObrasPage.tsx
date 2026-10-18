// Caminho: /frontend/src/pages/obras/ObrasPage.tsx
// Tela 1 — Gestão de Obras (RFC 4.1): listagem, criação/edição, seleção da obra ativa.

import { useState } from "react";
import { Plus, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useObras, useExcluirObra } from "@/hooks/useObras";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { ObraCard } from "@/components/obras/ObraCard";
import { ObraFormDialog } from "@/components/obras/ObraFormDialog";
import type { Obra } from "@/types/obra";

export function ObrasPage() {
  const { data: obras, isLoading, isError, refetch } = useObras();
  const { obraAtivaId, selecionarObra } = useObraAtiva();
  const excluir = useExcluirObra();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [obraEmEdicao, setObraEmEdicao] = useState<Obra | null>(null);

  function abrirCriacao() {
    setObraEmEdicao(null);
    setDialogOpen(true);
  }

  function abrirEdicao(obra: Obra) {
    setObraEmEdicao(obra);
    setDialogOpen(true);
  }

  function handleExcluir(obra: Obra) {
    const confirmado = window.confirm(`Excluir a obra "${obra.nome}"? Esta ação não pode ser desfeita.`);
    if (confirmado) excluir.mutate(obra.id);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Minhas Obras</h1>
          <p className="text-sm text-slate-500">Selecione uma obra para gerenciar suas etapas, materiais e compras.</p>
        </div>
        <Button onClick={abrirCriacao}>
          <Plus className="mr-1 h-4 w-4" /> Nova obra
        </Button>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando obras…
        </div>
      )}

      {/* Erro */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Não foi possível carregar as obras.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista vazia */}
      {!isLoading && !isError && obras && obras.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 font-medium text-slate-700">Nenhuma obra cadastrada</p>
          <p className="text-sm text-slate-500">Comece cadastrando a sua primeira obra.</p>
          <Button className="mt-4" onClick={abrirCriacao}>
            <Plus className="mr-1 h-4 w-4" /> Cadastrar obra
          </Button>
        </div>
      )}

      {/* Grid de obras */}
      {!isLoading && !isError && obras && obras.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((obra) => (
            <ObraCard
              key={obra.id}
              obra={obra}
              ativa={obra.id === obraAtivaId}
              onSelecionar={(o) => selecionarObra(o.id)}
              onEditar={abrirEdicao}
              onExcluir={handleExcluir}
            />
          ))}
        </div>
      )}

      <ObraFormDialog open={dialogOpen} onOpenChange={setDialogOpen} obra={obraEmEdicao} />
    </div>
  );
}