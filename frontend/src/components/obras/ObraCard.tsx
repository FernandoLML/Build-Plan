// Caminho: /frontend/src/components/obras/ObraCard.tsx
// Card de obra (Obsidian Precision): nome + badge, endereço, progresso e ações.

import { CheckCircle2, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/format";
import type { Obra } from "@/types/obra";

interface ObraCardProps {
  obra: Obra;
  ativa: boolean;
  progresso: number | null; // % de suprimentos (null = indisponível fora da obra ativa)
  onSelecionar: (obra: Obra) => void;
  onEditar: (obra: Obra) => void;
  onExcluir: (obra: Obra) => void;
}

export function ObraCard({ obra, ativa, progresso, onSelecionar, onEditar, onExcluir }: ObraCardProps) {
  return (
    <div
      className={`flex flex-col justify-between rounded-xl border bg-slate-900 p-5 transition-colors ${
        ativa ? "border-emerald-500/50 ring-1 ring-emerald-500/30" : "border-slate-800"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-slate-100">{obra.nome}</h3>
          {ativa && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Ativa
            </span>
          )}
        </div>

        {obra.endereco && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {obra.endereco}
          </p>
        )}
        {obra.descricao && <p className="line-clamp-2 text-sm text-slate-400">{obra.descricao}</p>}

        {/* Barra de progresso de suprimentos */}
        {progresso !== null ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Progresso de suprimentos</span>
              <span className="tabular-nums text-slate-400">{progresso}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${progresso === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-600">Selecione a obra para ver o progresso.</p>
        )}

        <p className="text-[11px] text-slate-600">Criada em {formatarData(obra.createdAt)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
        <Button
          size="sm"
          variant={ativa ? "secondary" : "default"}
          onClick={() => onSelecionar(obra)}
          disabled={ativa}
        >
          {ativa ? "Selecionada" : "Selecionar"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEditar(obra)}>
          <Pencil className="mr-1 h-4 w-4" /> Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-400 hover:text-red-300"
          onClick={() => onExcluir(obra)}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Excluir
        </Button>
      </div>
    </div>
  );
}