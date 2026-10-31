// Caminho: /frontend/src/pages/dashboard/DashboardPage.tsx
// Tela 2 — Dashboard Operacional (RFC 4.2 / Fig. 11). Obsidian Precision.

import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useDashboard } from "@/hooks/useDashboard";
import { useEtapas, useVinculosDaObra } from "@/hooks/useMateriais";
import { formatarMoeda } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BarraProgresso } from "@/components/dashboard/BarraProgresso";
import { StatusBadge } from "@/components/rastreabilidade/StatusBadge";

interface Alerta {
  cor: string;
  valor: number;
  texto: string;
}

export function DashboardPage() {
  const { obraAtivaId } = useObraAtiva();
  const { data, isLoading, isError, refetch } = useDashboard(obraAtivaId);
  const { data: etapas } = useEtapas(obraAtivaId);
  const { vinculos } = useVinculosDaObra(obraAtivaId);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
        <LayoutDashboard className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 font-medium text-slate-200">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para ver os indicadores.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  const etapasOrdenadas = [...(etapas ?? [])].sort((a, b) => a.ordem - b.ordem);

  // Progresso de SUPRIMENTOS por etapa = insumos aplicados / total de vínculos da etapa.
  const progressoEtapa = (etapaId: string) => {
    const vinc = vinculos.filter((v) => v.etapaId === etapaId);
    const total = vinc.length;
    const aplicados = vinc.filter((v) => v.status === "APLICADO").length;
    const pct = total > 0 ? Math.round((aplicados / total) * 100) : 0;
    return { total, aplicados, pct };
  };

  const etapaExecucao =
    etapasOrdenadas.find((e) => {
      const { pct } = progressoEtapa(e.id);
      return pct > 0 && pct < 100;
    }) ??
    etapasOrdenadas[0] ??
    null;
  const vinculosExecucao = etapaExecucao
    ? vinculos.filter((v) => v.etapaId === etapaExecucao.id)
    : [];

  const alertas: Alerta[] = [];
  if (data) {
    if (data.orcamento.itensSemPreco > 0) {
      alertas.push({ cor: "bg-amber-400", valor: data.orcamento.itensSemPreco, texto: "item(ns) da lista de compras sem preço" });
    }
    if (data.vinculos.porStatus.PREVISTO.quantidade > 0) {
      alertas.push({ cor: "bg-rose-400", valor: data.vinculos.porStatus.PREVISTO.quantidade, texto: "material(is) previsto(s) ainda não recebido(s)" });
    }
    if (data.vinculos.porStatus.APLICADO.quantidade > 0) {
      alertas.push({ cor: "bg-emerald-400", valor: data.vinculos.porStatus.APLICADO.quantidade, texto: "material(is) já aplicado(s)" });
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400">Visão executiva de suprimentos da obra ativa.</p>
      </header>

      {isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">Não foi possível carregar o dashboard.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* 1) KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
        ) : (
          <>
            <KpiCard
              titulo="Custo total orçado"
              valor={formatarMoeda(data.orcamento.totalOrcado)}
              descricao="Itens precificados"
              icon={<DollarSign className="h-4 w-4" />}
              accent="bg-emerald-500/10 text-emerald-400"
            />
            <KpiCard
              titulo="Total de insumos"
              valor={data.materiais.total}
              descricao="No catálogo da obra"
              icon={<Package className="h-4 w-4" />}
              accent="bg-slate-800/80 text-slate-400"
            />
            <KpiCard
              titulo="Vínculos material-etapa"
              valor={data.vinculos.total}
              descricao={`${data.etapas.total} etapa(s)`}
              icon={<Link2 className="h-4 w-4" />}
              accent="bg-indigo-500/10 text-indigo-400"
            />
            <KpiCard
              titulo="Itens a precificar"
              valor={data.orcamento.itensSemPreco}
              descricao="Pendentes de preço"
              icon={<AlertTriangle className="h-4 w-4" />}
              accent="bg-amber-500/10 text-amber-400"
            />
          </>
        )}
      </div>

      {/* 2) Split: progresso por etapa + alertas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-100">Progresso por etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {etapasOrdenadas.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500">Nenhuma etapa cadastrada nesta obra.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/materiais">Cadastrar etapa</Link>
                </Button>
              </div>
            ) : (
              etapasOrdenadas.map((etapa) => {
                const { total, aplicados, pct } = progressoEtapa(etapa.id);
                return (
                  <BarraProgresso
                    key={etapa.id}
                    label={etapa.nome}
                    percentual={pct}
                    detalhe={`${aplicados} de ${total} insumos aplicados • ${pct}%`}
                    cor={total > 0 && pct === 100 ? "bg-emerald-500" : "bg-indigo-600"}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-100">Pontos de atenção & alertas</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {alertas.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Nenhum ponto de atenção no momento.
              </p>
            ) : (
              <ul className="space-y-4">
                {alertas.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.cor}`} />
                    <p className="text-sm font-medium text-slate-300">
                      <span className="font-semibold tabular-nums text-slate-100">{a.valor}</span>{" "}
                      {a.texto}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3) Materiais da etapa em execução */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-100">
              Materiais da etapa em execução
              {etapaExecucao && <span className="ml-2 text-sm text-slate-500">· {etapaExecucao.nome}</span>}
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
              <Link to="/rastreabilidade">
                Abrir rastreabilidade <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!etapaExecucao ? (
            <p className="text-sm text-slate-500">Nenhuma etapa em execução.</p>
          ) : vinculosExecucao.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum material vinculado a esta etapa.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Material</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Qtd. prevista</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Unidade</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vinculosExecucao.map((v) => (
                    <tr key={v.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 font-medium text-slate-100">{v.material?.nome ?? "—"}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-200">{v.quantidade}</td>
                      <td className="px-4 py-3.5 text-slate-400">{v.material?.unidade ?? "—"}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={v.status} /></td>
                      <td className="px-4 py-3.5 text-right">
                        <Button asChild variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
                          <Link to="/rastreabilidade">
                            Ver <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}