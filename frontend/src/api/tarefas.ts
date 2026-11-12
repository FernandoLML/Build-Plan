// Caminho: /frontend/src/api/tarefas.ts
// Chamadas HTTP de Tarefas (M3). Alinhado a backend/src/routes/tarefa.routes.ts:
//  - /api/etapas/:etapaId/tarefas (listar/criar)
//  - /api/tarefas/:id (buscar/atualizar/remover)

import { api } from "@/lib/api";
import type { CreateTarefaPayload, Tarefa, UpdateTarefaPayload } from "@/types/tarefa";

export const tarefasApi = {
  // GET /api/etapas/:etapaId/tarefas (ordenadas por ordem, createdAt)
  async listarPorEtapa(etapaId: string): Promise<Tarefa[]> {
    const { data } = await api.get<Tarefa[]>(`/etapas/${etapaId}/tarefas`);
    return data;
  },

  // POST /api/etapas/:etapaId/tarefas
  async criar(etapaId: string, payload: CreateTarefaPayload): Promise<Tarefa> {
    const { data } = await api.post<Tarefa>(`/etapas/${etapaId}/tarefas`, payload);
    return data;
  },

  // PUT /api/tarefas/:id
  async atualizar(id: string, payload: UpdateTarefaPayload): Promise<Tarefa> {
    const { data } = await api.put<Tarefa>(`/tarefas/${id}`, payload);
    return data;
  },

  // DELETE /api/tarefas/:id
  async excluir(id: string): Promise<void> {
    await api.delete(`/tarefas/${id}`);
  },
};
