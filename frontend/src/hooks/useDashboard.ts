// Caminho: /frontend/src/hooks/useDashboard.ts
// Hook TanStack Query do dashboard — habilitado apenas com obra ativa.

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";

export function useDashboard(obraId: string | null) {
  return useQuery({
    queryKey: ["dashboard", obraId],
    queryFn: () => dashboardApi.obter(obraId as string),
    enabled: !!obraId,
  });
}