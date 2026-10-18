// Caminho: /frontend/src/pages/dashboard/DashboardPage.tsx
// Tela 2 — Dashboard Operacional (RFC 4.2). Consome a obra ativa do contexto.

import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, DollarSign, LayoutDashboard, Link2, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useDashboard } from "@/hooks/useDashboard";
import { formatarMoeda } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarraProgresso } from "@/components/dashboard/BarraProgresso";

export function DashboardPage() {
  const { obraAtivaId } = useObraAtiva();
  const { data, isLoading, isError, refetch } = useDashboard(obraAtivaId);

  // Nenhuma obra selecionada.
  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
          <LayoutDashboard className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 font-medium text-slate-700">Nenhuma obra selecionada</p>
          <p className="text-sm text-slate-500">
            Selecione uma obra para visualizar os indicadores operacionais.
          </p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão operacional de suprimentos da obra ativa.</p>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Erro */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Não foi possível carregar o dashboard.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Conteúdo */}
      {!isLoading && !isError && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              titulo="Custo total orçado"
              valor={formatarMoeda(data.orcamento.totalOrcado)}
              descricao="Soma dos itens precificados"
              icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
            />
            <KpiCard
              titulo="Materiais"
              valor={data.materiais.total}
              descricao="No catálogo da obra"
              icon={<Package className="h-4 w-4 text-slate-400" />}
            />
            <KpiCard
              titulo="Vínculos material-etapa"
              valor={data.vinculos.total}
              descricao={`${data.etapas.total} etapa(s)`}
              icon={<Link2 className="h-4 w-4 text-slate-400" />}
            />
            <KpiCard
              titulo="Itens sem preço"
              valor={data.orcamento.itensSemPreco}
              descricao="A precificar"
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            />
          </div>

          {/* Progresso */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progresso de suprimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarraProgresso
                label="Materiais recebidos"
                percentual={data.vinculos.porStatus.RECEBIDO.percentual}
                detalhe={`${data.vinculos.porStatus.RECEBIDO.quantidade}/${data.vinculos.total} (${data.vinculos.porStatus.RECEBIDO.percentual}%)`}
                cor="bg-sky-500"
              />
              <BarraProgresso
                label="Materiais aplicados"
                percentual={data.vinculos.porStatus.APLICADO.percentual}
                detalhe={`${data.vinculos.porStatus.APLICADO.quantidade}/${data.vinculos.total} (${data.vinculos.porStatus.APLICADO.percentual}%)`}
                cor="bg-emerald-500"
              />
              <BarraProgresso
                label="Progresso de tarefas"
                percentual={data.progressoTarefas.percentual}
                detalhe={`${data.progressoTarefas.concluidas}/${data.progressoTarefas.total} (${data.progressoTarefas.percentual}%)`}
                cor="bg-indigo-500"
              />
            </CardContent>
          </Card>

          {/* Pontos de atenção (derivados dos dados disponíveis) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pontos de atenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.orcamento.itensSemPreco === 0 && data.vinculos.porStatus.PREVISTO.quantidade === 0 ? (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Boxes className="h-4 w-4" /> Nenhum ponto de atenção no momento.
                </p>
              ) : (
                <>
                  {data.orcamento.itensSemPreco > 0 && (
                    <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                      <span className="text-sm text-amber-800">
                        Itens da lista de compras sem estimativa de preço
                      </span>
                      <Badge variant="secondary">{data.orcamento.itensSemPreco}</Badge>
                    </div>
                  )}
                  {data.vinculos.porStatus.PREVISTO.quantidade > 0 && (
                    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-700">
                        Materiais ainda previstos (não recebidos)
                      </span>
                      <Badge variant="secondary">{data.vinculos.porStatus.PREVISTO.quantidade}</Badge>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}