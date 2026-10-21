// Caminho: /frontend/src/api/memorial.ts
// Chamadas HTTP do UC01. Envia o CSV como JSON { csv } (o backend também aceita
// text/csv cru — mantemos JSON por simplicidade e para passar pelo express.json).

import { api } from "@/lib/api";
import type {
  ImportarMemorialResponse,
  ItemMemorial,
  PreviewMemorialResponse,
} from "@/types/memorial";

export const memorialApi = {
  async preview(obraId: string, csv: string): Promise<PreviewMemorialResponse> {
    const { data } = await api.post<PreviewMemorialResponse>(
      `/obras/${obraId}/materiais/preview-memorial`,
      { csv },
    );
    return data;
  },

  async importar(obraId: string, itens: ItemMemorial[]): Promise<ImportarMemorialResponse> {
    const { data } = await api.post<ImportarMemorialResponse>(
      `/obras/${obraId}/materiais/importar-memorial`,
      { itens },
    );
    return data;
  },
};