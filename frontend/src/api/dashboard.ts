// Caminho: /frontend/src/api/dashboard.ts
// Chamada HTTP pura e tipada do dashboard da obra.

import { api } from "@/lib/api";
import type { DashboardObra } from "@/types/dashboard";

export const dashboardApi = {
  async obter(obraId: string): Promise<DashboardObra> {
    const { data } = await api.get<DashboardObra>(`/obras/${obraId}/dashboard`);
    return data;
  },
};