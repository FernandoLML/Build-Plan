// Caminho: /frontend/src/api/compras.ts
// Chamadas HTTP da Lista de Compras / Itens (endpoints reais — M4 Fase 2 / M5).

import { api } from "@/lib/api";
import type { AtualizarItemPayload, ItemCompra, ListaCompras } from "@/types/compras";

/** "cor" (padrão) ou "pb": versão preto e branco, para impressoras sem cor. */
export type TemaExportacao = "cor" | "pb";

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

  // GET /api/listas-compras/:id/export.xlsx?tema=pb  (planilha estilizada, binário)
  async exportarXlsx(id: string, tema: TemaExportacao = "cor"): Promise<Blob> {
    const { data } = await api.get<Blob>(`/listas-compras/${id}/export.xlsx`, {
      responseType: "blob",
      params: tema === "pb" ? { tema } : undefined,
    });
    return data;
  },

  // GET /api/listas-compras/:id/export.pdf?tema=pb  (documento para impressão, binário)
  async exportarPdf(id: string, tema: TemaExportacao = "cor"): Promise<Blob> {
    const { data } = await api.get<Blob>(`/listas-compras/${id}/export.pdf`, {
      responseType: "blob",
      params: tema === "pb" ? { tema } : undefined,
    });
    return data;
  },
};