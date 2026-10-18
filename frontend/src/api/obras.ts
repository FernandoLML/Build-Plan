import { api } from "@/lib/api";
import type { CreateObraPayload, Obra, UpdateObraPayload } from "@/types/obra";

export const obrasApi = {
  async listar(): Promise<Obra[]> {
    const { data } = await api.get<Obra[]>("/obras");
    return data;
  },
  async buscar(id: string): Promise<Obra> {
    const { data } = await api.get<Obra>(`/obras/${id}`);
    return data;
  },
  async criar(payload: CreateObraPayload): Promise<Obra> {
    const { data } = await api.post<Obra>("/obras", payload);
    return data;
  },
  async atualizar(id: string, payload: UpdateObraPayload): Promise<Obra> {
    const { data } = await api.put<Obra>(`/obras/${id}`, payload);
    return data;
  },
  async excluir(id: string): Promise<void> {
    await api.delete(`/obras/${id}`);
  },
};