// Caminho: /frontend/src/hooks/useObras.ts
// Hooks TanStack Query para Obras: leitura em cache e mutações com invalidação.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { obrasApi } from "@/api/obras";
import type { CreateObraPayload, UpdateObraPayload } from "@/types/obra";

export const OBRAS_QUERY_KEY = ["obras"] as const;

export function useObras() {
  return useQuery({
    queryKey: OBRAS_QUERY_KEY,
    queryFn: obrasApi.listar,
  });
}

export function useCriarObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateObraPayload) => obrasApi.criar(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OBRAS_QUERY_KEY }),
  });
}

export function useAtualizarObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateObraPayload }) =>
      obrasApi.atualizar(args.id, args.payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OBRAS_QUERY_KEY }),
  });
}

export function useExcluirObra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => obrasApi.excluir(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OBRAS_QUERY_KEY }),
  });
}