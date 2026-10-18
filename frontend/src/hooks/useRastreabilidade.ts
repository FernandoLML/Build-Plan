// Caminho: /frontend/src/hooks/useRastreabilidade.ts
// Hooks da rastreabilidade: timeline de logs e transição de status (RN01).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rastreabilidadeApi } from "@/api/rastreabilidade";
import type { AtualizarStatusPayload } from "@/types/rastreabilidade";

export function useLogsVinculo(vinculoId: string | null) {
  return useQuery({
    queryKey: ["logs", vinculoId],
    queryFn: () => rastreabilidadeApi.listarLogs(vinculoId as string),
    enabled: !!vinculoId,
  });
}

export function useAtualizarStatusVinculo(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { vinculoId: string; etapaId: string; payload: AtualizarStatusPayload }) =>
      rastreabilidadeApi.atualizarStatus(args.vinculoId, args.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vinculos", variables.etapaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
      queryClient.invalidateQueries({ queryKey: ["logs", variables.vinculoId] });
    },
  });
}