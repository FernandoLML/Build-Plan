// Caminho: /frontend/src/api/compras.ts
// Chamadas HTTP da Lista de Compras / Itens (endpoints reais — M4 Fase 2 / M5).

import { api } from "@/lib/api";
import type { AtualizarItemPayload, ItemCompra, ListaCompras } from "@/types/compras";

export const comprasApi = {
  // GET /api/obras/:obraId/listas-compras
  async listarPorObra(obraId: string): Promise<ListaCompras[]> {
    const { data } = await api.get<ListaCompras[]>(`/obras/${obraId}/listas-compras`);
    return data;
  },

  // POST /api/etapas/:etapaId/lista-compras  (gera o snapshot a partir dos vínculos)
  async gerarPorEtapa(etapaId: string): Promise<ListaCompras> {
    const { data } = await api.post<ListaCompras>(`/etapas/${etapaId}/lista-compras`, {});
    return data;
  },

  // DELETE /api/listas-compras/:id
  async excluirLista(id: string): Promise<void> {
    await api.delete(`/listas-compras/${id}`);
  },

  // PATCH /api/itens-compra/:id  ("Informar preço")
  async atualizarItem(id: string, payload: AtualizarItemPayload): Promise<ItemCompra> {
    const { data } = await api.patch<ItemCompra>(`/itens-compra/${id}`, payload);
    return data;
  },

  // DELETE /api/itens-compra/:id
  async excluirItem(id: string): Promise<void> {
    await api.delete(`/itens-compra/${id}`);
  },

  // GET /api/listas-compras/:id/export.csv  (texto CSV cru)
  async exportarCsv(id: string): Promise<string> {
    const { data } = await api.get<string>(`/listas-compras/${id}/export.csv`, {
      responseType: "text",
    });
    return data;
  },
};