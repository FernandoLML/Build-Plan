// Caminho: /frontend/src/lib/suprimentos.ts
// Regras puras do Dashboard para SUPRIMENTOS por etapa (vínculos material-etapa):
// progresso = insumos APLICADOS / total de vínculos da etapa.

import type { StatusVinculo } from "@/types/material";

export interface ProgressoSuprimentos {
  total: number;
  aplicados: number;
  percentual: number; // 0–100, inteiro
}

type VinculoResumo = { etapaId: string; status: StatusVinculo };

/** Progresso de suprimentos de uma etapa. Etapa sem vínculos → 0%. */
export function calcularProgressoSuprimentos(
  vinculos: ReadonlyArray<VinculoResumo>,
  etapaId: string,
): ProgressoSuprimentos {
  const daEtapa = vinculos.filter((v) => v.etapaId === etapaId);
  const total = daEtapa.length;
  const aplicados = daEtapa.filter((v) => v.status === "APLICADO").length;
  const percentual = total > 0 ? Math.round((aplicados / total) * 100) : 0;
  return { total, aplicados, percentual };
}

/**
 * Etapa "em execução": a primeira (pela ordem) com suprimentos parcialmente
 * aplicados (0% < progresso < 100%); sem nenhuma assim, a primeira etapa.
 */
export function encontrarEtapaEmExecucao<E extends { id: string; ordem: number }>(
  etapas: ReadonlyArray<E>,
  vinculos: ReadonlyArray<VinculoResumo>,
): E | null {
  const ordenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);
  return (
    ordenadas.find((e) => {
      const { percentual } = calcularProgressoSuprimentos(vinculos, e.id);
      return percentual > 0 && percentual < 100;
    }) ??
    ordenadas[0] ??
    null
  );
}
