// Caminho: /frontend/src/components/rastreabilidade/StatusBadge.tsx
// Badge colorido por estado do vínculo (PREVISTO / RECEBIDO / APLICADO).

import type { StatusVinculo } from "@/types/material";
import { STATUS_LABEL } from "@/types/rastreabilidade";

const CLASSES: Record<StatusVinculo, string> = {
  PREVISTO: "bg-slate-800 text-slate-300",
  RECEBIDO: "bg-sky-500/10 text-sky-400",
  APLICADO: "bg-emerald-500/10 text-emerald-400",
};

export function StatusBadge({ status }: { status: StatusVinculo }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}