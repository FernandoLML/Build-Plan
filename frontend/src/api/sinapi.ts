// Caminho: /frontend/src/api/sinapi.ts
// Chamada HTTP de busca no catálogo SINAPI (autocomplete de precificação).

import { api } from "@/lib/api";
import type { BuscarSinapiParams, ItemSinapi } from "@/types/sinapi";

export const sinapiApi = {
  // GET /api/sinapi?q=&uf=&regime=&limit=
  async buscar(params: BuscarSinapiParams): Promise<ItemSinapi[]> {
    const { data } = await api.get<ItemSinapi[]>("/sinapi", { params });
    return data;
  },
};