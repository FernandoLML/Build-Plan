// Caminho: /frontend/src/components/rastreabilidade/TimelineDialog.tsx
// Linha do tempo (timeline) de auditoria de um vínculo (GET /vinculos/:id/logs).

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLogsVinculo } from "@/hooks/useRastreabilidade";
import { STATUS_LABEL } from "@/types/rastreabilidade";
import { formatarDataHora } from "@/lib/format";

interface TimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vinculoId: string | null;
  materialNome?: string;
}

export function TimelineDialog({ open, onOpenChange, vinculoId, materialNome }: TimelineDialogProps) {
  // Só consulta quando o modal está aberto.
  const { data: logs, isLoading } = useLogsVinculo(open ? vinculoId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Linha do tempo</DialogTitle>
          <DialogDescription>{materialNome ?? "Histórico de rastreabilidade"}</DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-slate-500">Carregando histórico…</p>}

        {!isLoading && logs && logs.length === 0 && (
          <p className="text-sm text-slate-500">
            Nenhuma transição registrada ainda para este vínculo.
          </p>
        )}

        {!isLoading && logs && logs.length > 0 && (
          <ol className="relative space-y-4 border-l border-slate-200 pl-5">
            {logs.map((log) => (
              <li key={log.id} className="relative">
                <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                <p className="text-sm font-medium text-slate-800">
                  {log.statusAnterior ? `${STATUS_LABEL[log.statusAnterior]} → ` : ""}
                  {STATUS_LABEL[log.statusNovo]}
                </p>
                <p className="text-xs text-slate-500">
                  {formatarDataHora(log.criadoEm)} · {log.usuario.nome}
                </p>
                {log.detalhes && (
                  <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                    {log.detalhes}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}