// Caminho: /frontend/src/pages/compras/ComprasPage.tsx
// Tela 5 — Lista de Compras (RFC 4.5). Layout split: etapas/tabela + resumo lateral.

import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Download, Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useListasCompras, useExcluirItemCompra, useExcluirLista } from "@/hooks/useCompras";
import { useEtapas } from "@/hooks/useMateriais";
import { comprasApi } from "@/api/compras";
import { baixarArquivo } from "@/lib/download";
import { formatarMoeda } from "@/lib/format";
import { GerarListaDialog } from "@/components/compras/GerarListaDialog";
import { InformarPrecoDialog } from "@/components/compras/InformarPrecoDialog";
import type { ItemCompra } from "@/types/compras";

export function ComprasPage() {
  const { obraAtivaId } = useObraAtiva();
  const listas = useListasCompras(obraAtivaId);
  const { data: etapas } = useEtapas(obraAtivaId);
  const excluirItem = useExcluirItemCompra(obraAtivaId);
  const excluirLista = useExcluirLista(obraAtivaId);

  const [gerarOpen, setGerarOpen] = useState(false);
  const [listaSelId, setListaSelId] = useState<string | null>(null);
  const [itemEditando, setItemEditando] = useState<ItemCompra | null>(null);
  const [exportando, setExportando] = useState(false);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
        <ShoppingCart className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 font-medium text-slate-200">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para ver as listas de compras.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  const nomeEtapa = (etapaId: string | null): string =>
    etapaId ? (etapas?.find((e) => e.id === etapaId)?.nome ?? "Etapa") : "Geral";

  const dados = listas.data ?? [];
  const listaAtual = dados.find((l) => l.id === listaSelId) ?? dados[0] ?? null;

  async function exportar(id: string) {
    setExportando(true);
    try {
      const csv = await comprasApi.exportarCsv(id);
      baixarArquivo(`lista-compras-${id}.csv`, csv);
    } finally {
      setExportando(false);
    }
  }

  const cobertura =
    listaAtual && listaAtual.totais.totalItens > 0
      ? Math.round(
          ((listaAtual.totais.totalItens - listaAtual.totais.itensSemPreco) /
            listaAtual.totais.totalItens) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">Lista de Compras</h1>
          <p className="text-sm text-slate-400">Plano de aquisições por etapa, com preços e exportação.</p>
        </div>
        <Button onClick={() => setGerarOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Gerar lista
        </Button>
      </header>

      {listas.isLoading && (
        <div className="flex items-center gap-2 py-10 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando listas…
        </div>
      )}

      {listas.isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">Não foi possível carregar as listas de compras.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => listas.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!listas.isLoading && !listas.isError && dados.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 font-medium text-slate-200">Nenhuma lista gerada</p>
          <p className="text-sm text-slate-500">Gere uma lista a partir de uma etapa com materiais vinculados.</p>
          <Button className="mt-4" onClick={() => setGerarOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Gerar lista
          </Button>
        </div>
      )}

      {listaAtual && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Esquerda — abas de etapas + tabela */}
          <div className="space-y-4">
            {/* Abas horizontais de etapas */}
            <div className="flex flex-wrap gap-2">
              {dados.map((lista) => {
                const ativa = lista.id === listaAtual.id;
                return (
                  <button
                    key={lista.id}
                    onClick={() => setListaSelId(lista.id)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      ativa
                        ? "border-indigo-500 bg-indigo-600/10 text-slate-100"
                        : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {nomeEtapa(lista.etapaId)}
                  </button>
                );
              })}
            </div>

            {/* Banner de itens sem preço */}
            {listaAtual.totais.itensSemPreco > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {listaAtual.totais.itensSemPreco} item(ns) sem preço — informe a cotação para orçar a etapa.
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Material</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Qtd.</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Unid.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Preço unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Subtotal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaAtual.itens.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium text-slate-100">{item.descricao}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-200">{item.quantidade}</td>
                      <td className="px-4 py-3 text-slate-400">{item.unidade}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                        {item.precoUnitario ? formatarMoeda(item.precoUnitario) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-400">
                        {item.precoTotal ? formatarMoeda(item.precoTotal) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setItemEditando(item)}>
                            Precificar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => excluirItem.mutate(item.id)}
                            title="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {listaAtual.itens.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                        Nenhum item nesta lista.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Direita — resumo + exportação */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-100">Resumo da etapa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total de itens</span>
                  <span className="tabular-nums text-slate-200">{listaAtual.totais.totalItens}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Com estimativa</span>
                  <span className="tabular-nums text-slate-200">
                    {listaAtual.totais.totalItens - listaAtual.totais.itensSemPreco}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sem estimativa</span>
                  <span className="tabular-nums text-amber-400">{listaAtual.totais.itensSemPreco}</span>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Custo total estimado</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-emerald-400">
                    {formatarMoeda(listaAtual.totais.totalOrcado)}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Cobertura de preços</span>
                    <span className="tabular-nums text-slate-400">{cobertura}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${cobertura}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-100">Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => exportar(listaAtual.id)}
                  disabled={exportando}
                >
                  <Download className="mr-1 h-4 w-4" /> {exportando ? "Exportando…" : "Exportar CSV"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300"
                  onClick={() => {
                    if (window.confirm("Excluir esta lista de compras?")) {
                      excluirLista.mutate(listaAtual.id);
                      setListaSelId(null);
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Excluir lista
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <GerarListaDialog open={gerarOpen} onOpenChange={setGerarOpen} obraId={obraAtivaId} />
      <InformarPrecoDialog
        open={itemEditando !== null}
        onOpenChange={(o) => !o && setItemEditando(null)}
        item={itemEditando}
        obraId={obraAtivaId}
      />
    </div>
  );
}