// Caminho: /frontend/src/pages/rastreabilidade/RastreabilidadePage.tsx
// Tela 6 — Rastreabilidade e Linha do Tempo (RFC 4.6).

import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useEtapas, useVinculosPorEtapa } from "@/hooks/useMateriais";
import { PROXIMO_STATUS, STATUS_LABEL } from "@/types/rastreabilidade";
import type { VinculoMaterialEtapa } from "@/types/material";
import { StatusBadge } from "@/components/rastreabilidade/StatusBadge";
import { MudarStatusDialog } from "@/components/rastreabilidade/MudarStatusDialog";
import { TimelineDialog } from "@/components/rastreabilidade/TimelineDialog";

export function RastreabilidadePage() {
  const { obraAtivaId } = useObraAtiva();
  const { data: etapas } = useEtapas(obraAtivaId);
  const [etapaId, setEtapaId] = useState<string | null>(null);
  const { data: vinculos, isLoading } = useVinculosPorEtapa(etapaId);

  const [mudarStatus, setMudarStatus] = useState<VinculoMaterialEtapa | null>(null);
  const [timeline, setTimeline] = useState<VinculoMaterialEtapa | null>(null);

  if (!obraAtivaId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 font-medium text-slate-700">Nenhuma obra selecionada</p>
        <p className="text-sm text-slate-500">Selecione uma obra para acompanhar a rastreabilidade.</p>
        <Button asChild className="mt-4">
          <Link to="/obras">Ir para Obras</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Rastreabilidade</h1>
        <p className="text-sm text-slate-500">
          Acompanhe o ciclo de vida dos materiais (Previsto → Recebido → Aplicado) e o histórico de auditoria.
        </p>
      </header>

      <div className="max-w-sm space-y-1">
        <label className="text-sm font-medium text-slate-700">Etapa</label>
        <Select value={etapaId ?? undefined} onValueChange={(v) => setEtapaId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma etapa" />
          </SelectTrigger>
          <SelectContent>
            {etapas?.map((etapa) => (
              <SelectItem key={etapa.id} value={etapa.id}>
                {etapa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!etapaId && (
        <p className="text-sm text-slate-500">Escolha uma etapa para listar os materiais vinculados.</p>
      )}

      {etapaId && isLoading && <p className="text-sm text-slate-500">Carregando vínculos…</p>}

      {etapaId && !isLoading && vinculos && vinculos.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum material vinculado a esta etapa.</p>
      )}

      {etapaId && vinculos && vinculos.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Status atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vinculos.map((vinculo) => {
                const proximo = PROXIMO_STATUS[vinculo.status];
                return (
                  <TableRow key={vinculo.id}>
                    <TableCell className="font-medium">{vinculo.material?.nome ?? "—"}</TableCell>
                    <TableCell className="text-right">{vinculo.quantidade}</TableCell>
                    <TableCell>
                      <StatusBadge status={vinculo.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {proximo && (
                          <Button size="sm" onClick={() => setMudarStatus(vinculo)}>
                            Avançar para {STATUS_LABEL[proximo]}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setTimeline(vinculo)}>
                          <History className="mr-1 h-4 w-4" /> Linha do tempo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {etapaId && (
        <MudarStatusDialog
          open={mudarStatus !== null}
          onOpenChange={(o) => !o && setMudarStatus(null)}
          vinculo={mudarStatus}
          etapaId={etapaId}
          obraId={obraAtivaId}
        />
      )}

      <TimelineDialog
        open={timeline !== null}
        onOpenChange={(o) => !o && setTimeline(null)}
        vinculoId={timeline?.id ?? null}
        materialNome={timeline?.material?.nome}
      />
    </div>
  );
}