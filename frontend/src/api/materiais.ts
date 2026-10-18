// Caminho: /frontend/src/api/materiais.ts
// Chamadas HTTP de Materiais, Etapas (para seleção) e Vínculos material-etapa.
// Alinhado aos endpoints reais homologados no M3/M4.

import { api } from "@/lib/api";
import type { CreateEtapaPayload, Etapa, EtapaComProgresso } from "@/types/etapa";
import type {
  CreateVinculoPayload,
  Material,
  UpdateMaterialPayload,
  VinculoMaterialEtapa,
} from "@/types/material";

export const materiaisApi = {
  // GET /api/obras/:obraId/materiais
  async listar(obraId: string): Promise<Material[]> {
    const { data } = await api.get<Material[]>(`/obras/${obraId}/materiais`);
    return data;
  },

  // PUT /api/materiais/:id
  async atualizar(id: string, payload: UpdateMaterialPayload): Promise<Material> {
    const { data } = await api.put<Material>(`/materiais/${id}`, payload);
    return data;
  },

  // DELETE /api/materiais/:id
  async excluir(id: string): Promise<void> {
    await api.delete(`/materiais/${id}`);
  },
};

export const etapasApi = {
  // GET /api/obras/:obraId/etapas
  async listar(obraId: string): Promise<EtapaComProgresso[]> {
    const { data } = await api.get<EtapaComProgresso[]>(`/obras/${obraId}/etapas`);
    return data;
  },

  // POST /api/obras/:obraId/etapas
  async criar(obraId: string, payload: CreateEtapaPayload): Promise<Etapa> {
    const { data } = await api.post<Etapa>(`/obras/${obraId}/etapas`, payload);
    return data;
  },
};

export const vinculosApi = {
  // GET /api/etapas/:etapaId/materiais  (vínculos da etapa, com material incluído)
  async listarPorEtapa(etapaId: string): Promise<VinculoMaterialEtapa[]> {
    const { data } = await api.get<VinculoMaterialEtapa[]>(`/etapas/${etapaId}/materiais`);
    return data;
  },

  // POST /api/etapas/:etapaId/materiais
  async criar(etapaId: string, payload: CreateVinculoPayload): Promise<VinculoMaterialEtapa> {
    const { data } = await api.post<VinculoMaterialEtapa>(`/etapas/${etapaId}/materiais`, payload);
    return data;
  },

  // DELETE /api/vinculos/:id
  async excluir(id: string): Promise<void> {
    await api.delete(`/vinculos/${id}`);
  },
};