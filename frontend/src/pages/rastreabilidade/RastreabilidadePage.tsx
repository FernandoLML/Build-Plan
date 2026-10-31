// Caminho: /frontend/src/pages/rastreabilidade/RastreabilidadePage.tsx
// Tela 6 — Rastreabilidade (RFC 4.6). Master-detail: tabela + timeline lateral fixa.

import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useEtapas, useVinculosDaObra } from "@/hooks/useMateriais";
import { PROXIMO_STATUS, STATUS_LABEL } from "@/types/rastreabilidade";
import type { VinculoMaterialEtapa } from "@/types/material";
import { StatusBadge } from "@/components/rastreabilidade/StatusBadge";
import { MudarStatusDialog } from "@/components/rastreabilidade/MudarStatusDialog";
import { TimelinePanel } from "@/components/rastreabilidade/TimelinePanel";

export function RastreabilidadePage() {
  const { obraAtivaId } = useObraAtiva();
  const { data: etapas } = useEtapas(obraAtivaId);
  const { vinculos, isLoading } = useVinculosDaObra(obraAtivaId);

  const [filtroEtapa, setFiltroEtapa] = useState("todas");
  const [selecionado, setSelecionado] = useState<VinculoMaterialEtapa | null>(null);
  const [mudarStatus, setMudarStatus] = useState<VinculoMaterialEtapa | null>(null);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 p-12 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 font-medium text-slate-200">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para acompanhar a rastreabilidade.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  const filtrados =
    filtroEtapa === "todas" ? vinculos : vinculos.filter((v) => v.etapaId === filtroEtapa);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-100">Rastreabilidade</h1>
        <p className="text-sm text-slate-400">
          Ciclo de vida dos materiais (Previsto → Recebido → Aplicado) e histórico de auditoria.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Esquerda — filtros + tabela */}
        <div className="space-y-4">
          <div className="max-w-xs">
            <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as etapas</SelectItem>
                {etapas?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && <p className="text-sm text-slate-500">Carregando insumos…</p>}

          {!isLoading && filtrados.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum material vinculado para o filtro atual.</p>
          )}

          {filtrados.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Material</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Qtd.</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((v) => {
                    const ativo = selecionado?.id === v.id;
                    const proximo = PROXIMO_STATUS[v.status];
                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelecionado(v)}
                        className={`cursor-pointer border-l-2 border-b border-slate-800/60 last:border-b-0 ${
                          ativo
                            ? "border-l-indigo-500 bg-indigo-600/10"
                            : "border-l-transparent hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-100">{v.material?.nome ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-200">{v.quantidade}</td>
                        <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                        <td className="px-4 py-3 text-right">
                          {proximo ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMudarStatus(v);
                              }}
                            >
                              Mudar p/ {STATUS_LABEL[proximo]}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500">Concluído</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Direita — timeline fixa */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <TimelinePanel vinculoId={selecionado?.id ?? null} materialNome={selecionado?.material?.nome} />
        </div>
      </div>

      <MudarStatusDialog
        open={mudarStatus !== null}
        onOpenChange={(o) => !o && setMudarStatus(null)}
        vinculo={mudarStatus}
        etapaId={mudarStatus?.etapaId ?? ""}
        obraId={obraAtivaId}
      />
    </div>
  );
}