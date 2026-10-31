// Caminho: /frontend/src/components/rastreabilidade/TimelinePanel.tsx
// Painel lateral fixo da linha do tempo de um vínculo (substitui o modal).

import { History } from "lucide-react";
import { useLogsVinculo } from "@/hooks/useRastreabilidade";
import { STATUS_LABEL } from "@/types/rastreabilidade";
import type { StatusVinculo } from "@/types/material";
import { formatarDataHora } from "@/lib/format";

const COR_NO: Record<StatusVinculo, string> = {
  PREVISTO: "bg-slate-500",
  RECEBIDO: "bg-sky-500",
  APLICADO: "bg-emerald-500",
};

interface TimelinePanelProps {
  vinculoId: string | null;
  materialNome?: string;
}

export function TimelinePanel({ vinculoId, materialNome }: TimelinePanelProps) {
  const { data: logs, isLoading } = useLogsVinculo(vinculoId);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-slate-400" />
        <h2 className="font-display text-base font-semibold text-slate-100">Linha do tempo</h2>
      </div>

      {!vinculoId && (
        <p className="text-sm text-slate-500">Selecione um insumo na tabela para ver o histórico.</p>
      )}

      {vinculoId && (
        <>
          {materialNome && <p className="mb-3 text-sm text-slate-400">{materialNome}</p>}

          {isLoading && <p className="text-sm text-slate-500">Carregando histórico…</p>}

          {!isLoading && logs && logs.length === 0 && (
            <p className="text-sm text-slate-500">Nenhuma transição registrada ainda.</p>
          )}

          {!isLoading && logs && logs.length > 0 && (
            <ol className="relative space-y-4 border-l border-slate-800 pl-5">
              {logs.map((log) => (
                <li key={log.id} className="relative">
                  <span
                    className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-slate-900 ${COR_NO[log.statusNovo]}`}
                  />
                  <p className="text-sm font-semibold text-slate-100">
                    {log.statusAnterior ? `${STATUS_LABEL[log.statusAnterior]} → ` : ""}
                    {STATUS_LABEL[log.statusNovo]}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatarDataHora(log.criadoEm)} · {log.usuario.nome}
                  </p>
                  {log.detalhes && (
                    <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">
                      {log.detalhes}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}