// Caminho: /frontend/src/components/rastreabilidade/StatusBadge.tsx
// Badge colorido por estado do vínculo (PREVISTO / RECEBIDO / APLICADO).

import type { StatusVinculo } from "@/types/material";
import { STATUS_LABEL } from "@/types/rastreabilidade";

const CLASSES: Record<StatusVinculo, string> = {
  PREVISTO: "bg-slate-100 text-slate-700",
  RECEBIDO: "bg-sky-100 text-sky-700",
  APLICADO: "bg-emerald-100 text-emerald-700",
};

export function StatusBadge({ status }: { status: StatusVinculo }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}