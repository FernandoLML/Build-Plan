// Caminho: /frontend/src/components/dashboard/KpiCard.tsx
// Card de KPI (Obsidian Precision): título em linha única, ícone alinhado, respiro.

import type { ReactNode } from "react";

interface KpiCardProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icon?: ReactNode;
  /** Classes do container do ícone (ex.: "bg-indigo-500/10 text-indigo-400"). */
  accent?: string;
}

export function KpiCard({ titulo, valor, descricao, icon, accent }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {titulo}
        </p>
        {icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              accent ?? "bg-slate-800/80 text-slate-400"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-slate-100">{valor}</p>
      {descricao && <p className="mt-1.5 text-xs text-slate-400">{descricao}</p>}
    </div>
  );
}