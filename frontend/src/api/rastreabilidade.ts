// Caminho: /frontend/src/api/rastreabilidade.ts
// Chamadas HTTP da rastreabilidade: transição de status e timeline de logs.

import { api } from "@/lib/api";
import type { AtualizarStatusPayload, LogRastreabilidade } from "@/types/rastreabilidade";
import type { VinculoMaterialEtapa } from "@/types/material";

export const rastreabilidadeApi = {
  // PATCH /api/vinculos/:id/status  (valida a RN01 no backend)
  async atualizarStatus(
    vinculoId: string,
    payload: AtualizarStatusPayload,
  ): Promise<VinculoMaterialEtapa> {
    const { data } = await api.patch<VinculoMaterialEtapa>(`/vinculos/${vinculoId}/status`, payload);
    return data;
  },

  // GET /api/vinculos/:id/logs  (timeline em ordem cronológica asc)
  async listarLogs(vinculoId: string): Promise<LogRastreabilidade[]> {
    const { data } = await api.get<LogRastreabilidade[]>(`/vinculos/${vinculoId}/logs`);
    return data;
  },
};