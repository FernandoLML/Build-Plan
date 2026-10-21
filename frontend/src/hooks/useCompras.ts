// Caminho: /frontend/src/hooks/useCompras.ts
// Hooks TanStack Query da Tela 5. Mutações invalidam listas e dashboard.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { comprasApi } from "@/api/compras";
import type { AtualizarItemPayload } from "@/types/compras";

export function useListasCompras(obraId: string | null) {
  return useQuery({
    queryKey: ["listas-compras", obraId],
    queryFn: () => comprasApi.listarPorObra(obraId as string),
    enabled: !!obraId,
  });
}

function invalidar(obraId: string | null) {
  return (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ["listas-compras", obraId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
  };
}

export function useGerarLista(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (etapaId: string) => comprasApi.gerarPorEtapa(etapaId),
    onSuccess: () => invalidar(obraId)(queryClient),
  });
}

export function useExcluirLista(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => comprasApi.excluirLista(id),
    onSuccess: () => invalidar(obraId)(queryClient),
  });
}

export function useAtualizarItemCompra(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: AtualizarItemPayload }) =>
      comprasApi.atualizarItem(args.id, args.payload),
    onSuccess: () => invalidar(obraId)(queryClient),
  });
}

export function useExcluirItemCompra(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => comprasApi.excluirItem(id),
    onSuccess: () => invalidar(obraId)(queryClient),
  });
}