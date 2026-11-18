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
 * Etapa "em execução": a primeira (pela ordem) que ainda tem material vinculado
 * sem aplicar. Assim, quando todos os materiais da etapa 1 são aplicados, o
 * dashboard passa sozinho para a etapa 2, mesmo que nela nada tenha avançado.
 *
 * Etapas sem vínculos são ignoradas (não há o que acompanhar). Sem nenhuma
 * pendência, mostra a última etapa com vínculos (a obra está em dia); sem
 * nenhum vínculo, a primeira etapa.
 */
export function encontrarEtapaEmExecucao<E extends { id: string; ordem: number }>(
  etapas: ReadonlyArray<E>,
  vinculos: ReadonlyArray<VinculoResumo>,
): E | null {
  const ordenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);
  const comVinculos = ordenadas.filter((e) => calcularProgressoSuprimentos(vinculos, e.id).total > 0);
  const pendente = comVinculos.find((e) => calcularProgressoSuprimentos(vinculos, e.id).percentual < 100);
  return pendente ?? comVinculos.at(-1) ?? ordenadas[0] ?? null;
}

export interface SaldoMaterial {
  total: number;
  vinculado: number;
  disponivel: number;
}

/**
 * Saldo de um material: quantidade no catálogo menos o que já está vinculado
 * às etapas. Mesma regra que a API aplica ao criar um vínculo.
 */
export function calcularSaldoMaterial(
  material: { id: string; quantidade: string | number },
  vinculos: ReadonlyArray<{ materialId: string; quantidade: string | number }>,
): SaldoMaterial {
  const total = Number(material.quantidade);
  // Soma em milésimos (a API guarda 3 casas) para não acumular erro de ponto flutuante.
  const vinculadoMilesimos = vinculos
    .filter((v) => v.materialId === material.id)
    .reduce((soma, v) => soma + Math.round(Number(v.quantidade) * 1000), 0);
  const vinculado = vinculadoMilesimos / 1000;
  const disponivel = Math.max(0, Math.round(total * 1000) - vinculadoMilesimos) / 1000;
  return { total, vinculado, disponivel };
}
