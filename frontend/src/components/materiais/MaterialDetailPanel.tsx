// Caminho: /frontend/src/components/materiais/MaterialDetailPanel.tsx
// Painel lateral do material selecionado: detalhes + etapas vinculadas (master-detail).

import { Link2, Pencil, PackageSearch, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Material } from "@/types/material";

export interface VinculoResumo {
  id: string;
  etapaNome: string;
  quantidade: string;
}

interface MaterialDetailPanelProps {
  material: Material | null;
  vinculos: VinculoResumo[];
  carregandoVinculos?: boolean;
  onVincular: (material: Material) => void;
  onEditar: (material: Material) => void;
  onExcluir: (material: Material) => void;
}

export function MaterialDetailPanel({
  material,
  vinculos,
  carregandoVinculos,
  onVincular,
  onEditar,
  onExcluir,
}: MaterialDetailPanelProps) {
  if (!material) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-6 text-center">
        <PackageSearch className="h-8 w-8 text-slate-600" />
        <p className="mt-2 text-sm text-slate-500">Selecione um material para ver os detalhes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {material.codigoSinapi ? `SINAPI ${material.codigoSinapi}` : "Sem código SINAPI"}
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-slate-100">{material.nome}</h2>
        <span className="mt-1 inline-flex rounded-full border border-slate-700/60 bg-slate-800/50 px-2 py-0.5 text-xs font-medium text-slate-400">
          Origem: {material.origem === "MEMORIAL" ? "Memorial" : "Manual"}
        </span>
      </div>

      <p className="text-sm text-slate-400">{material.especificacao || "Sem especificação técnica."}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Quantidade</p>
          <p className="mt-1 font-display text-lg font-semibold text-slate-100">{material.quantidade}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Unidade</p>
          <p className="mt-1 font-display text-lg font-semibold text-slate-100">{material.unidade}</p>
        </div>
      </div>

      {/* Etapas vinculadas */}
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Etapas vinculadas
        </p>

        {carregandoVinculos ? (
          <p className="text-sm text-slate-500">Carregando vínculos…</p>
        ) : vinculos.length === 0 ? (
          <p className="text-sm text-slate-500">Este material ainda não está vinculado a etapas.</p>
        ) : (
          <ul className="space-y-1">
            {vinculos.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
              >
                <span className="truncate text-sm text-slate-200">{v.etapaNome}</span>
                <span className="shrink-0 text-sm font-medium text-slate-400">
                  {v.quantidade} {material.unidade}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Button className="w-full" onClick={() => onVincular(material)}>
          <Link2 className="mr-1 h-4 w-4" /> Vincular a etapa
        </Button>
      </div>

      <div className="flex gap-2 border-t border-slate-800 pt-3">
        <Button variant="outline" className="flex-1" onClick={() => onEditar(material)}>
          <Pencil className="mr-1 h-4 w-4" /> Editar
        </Button>
        <Button
          variant="outline"
          className="flex-1 text-red-400 hover:text-red-300"
          onClick={() => onExcluir(material)}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Excluir
        </Button>
      </div>
    </div>
  );
}