// Caminho: /frontend/src/pages/compras/ComprasPage.tsx
// Tela 5 — Lista de Compras / Suprimentos (RFC 4.5).

import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useListasCompras } from "@/hooks/useCompras";
import { useEtapas } from "@/hooks/useMateriais";
import { GerarListaDialog } from "@/components/compras/GerarListaDialog";
import { ListaComprasCard } from "@/components/compras/ListaComprasCard";

export function ComprasPage() {
  const { obraAtivaId } = useObraAtiva();
  const listas = useListasCompras(obraAtivaId);
  const { data: etapas } = useEtapas(obraAtivaId);

  const [gerarOpen, setGerarOpen] = useState(false);
  const [somenteSemPreco, setSomenteSemPreco] = useState(false);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
        <ShoppingCart className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 font-medium text-slate-700">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para ver as listas de compras.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  const nomeEtapa = (etapaId: string | null): string =>
    etapaId ? (etapas?.find((e) => e.id === etapaId)?.nome ?? "—") : "Geral";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Lista de Compras</h1>
          <p className="text-sm text-slate-500">
            Gere listas por etapa, informe preços e exporte o plano de aquisições.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={somenteSemPreco}
              onChange={(e) => setSomenteSemPreco(e.target.checked)}
            />
            Somente itens sem preço
          </label>
          <Button onClick={() => setGerarOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Gerar lista
          </Button>
        </div>
      </header>

      {listas.isLoading && (
        <div className="flex items-center gap-2 py-10 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando listas…
        </div>
      )}

      {listas.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Não foi possível carregar as listas de compras.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => listas.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!listas.isLoading && !listas.isError && listas.data && listas.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 font-medium text-slate-700">Nenhuma lista gerada</p>
          <p className="text-sm text-slate-500">
            Gere uma lista a partir de uma etapa com materiais vinculados.
          </p>
          <Button className="mt-4" onClick={() => setGerarOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Gerar lista
          </Button>
        </div>
      )}

      {!listas.isLoading && !listas.isError && listas.data && listas.data.length > 0 && (
        <div className="space-y-4">
          {listas.data.map((lista) => (
            <ListaComprasCard
              key={lista.id}
              lista={lista}
              etapaNome={nomeEtapa(lista.etapaId)}
              obraId={obraAtivaId}
              somenteSemPreco={somenteSemPreco}
            />
          ))}
        </div>
      )}

      <GerarListaDialog open={gerarOpen} onOpenChange={setGerarOpen} obraId={obraAtivaId} />
    </div>
  );
}