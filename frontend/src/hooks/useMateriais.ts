// Caminho: /frontend/src/hooks/useMateriais.ts
// Hooks TanStack Query da Tela 4: materiais, etapas (p/ seleção) e vínculos.

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { etapasApi, materiaisApi, vinculosApi } from "@/api/materiais";
import type { CreateEtapaPayload } from "@/types/etapa";
import type {
  CreateMaterialPayload,
  CreateVinculoPayload,
  UpdateMaterialPayload,
  VinculoMaterialEtapa,
} from "@/types/material";

// ---- Materiais ----
export function useMateriais(obraId: string | null) {
  return useQuery({
    queryKey: ["materiais", obraId],
    queryFn: () => materiaisApi.listar(obraId as string),
    enabled: !!obraId,
  });
}

export function useCriarMaterial(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialPayload) => materiaisApi.criar(obraId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiais", obraId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
    },
  });
}

export function useAtualizarMaterial(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateMaterialPayload }) =>
      materiaisApi.atualizar(args.id, args.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiais", obraId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
    },
  });
}

export function useExcluirMaterial(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materiaisApi.excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materiais", obraId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
    },
  });
}

// ---- Etapas (seleção no vínculo) ----
export function useEtapas(obraId: string | null) {
  return useQuery({
    queryKey: ["etapas", obraId],
    queryFn: () => etapasApi.listar(obraId as string),
    enabled: !!obraId,
  });
}

export function useCriarEtapa(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEtapaPayload) => etapasApi.criar(obraId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etapas", obraId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
    },
  });
}

// ---- Vínculos (por etapa) ----
export function useVinculosPorEtapa(etapaId: string | null) {
  return useQuery({
    queryKey: ["vinculos", etapaId],
    queryFn: () => vinculosApi.listarPorEtapa(etapaId as string),
    enabled: !!etapaId,
  });
}

/**
 * Agrega os vínculos de TODAS as etapas da obra, reaproveitando o mesmo endpoint
 * e as mesmas chaves de cache (['vinculos', etapaId]) via useQueries. Somente leitura.
 */
export function useVinculosDaObra(obraId: string | null): {
  vinculos: VinculoMaterialEtapa[];
  isLoading: boolean;
} {
  const { data: etapas } = useEtapas(obraId);
  const results = useQueries({
    queries: (etapas ?? []).map((etapa) => ({
      queryKey: ["vinculos", etapa.id],
      queryFn: () => vinculosApi.listarPorEtapa(etapa.id),
      enabled: !!obraId,
    })),
  });
  const vinculos = results.flatMap(
    (r) => (r.data as VinculoMaterialEtapa[] | undefined) ?? [],
  );
  const isLoading = results.some((r) => r.isLoading);
  return { vinculos, isLoading };
}

export function useCriarVinculo(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { etapaId: string; payload: CreateVinculoPayload }) =>
      vinculosApi.criar(args.etapaId, args.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vinculos", variables.etapaId] });
      queryClient.invalidateQueries({ queryKey: ["etapas", obraId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
    },
  });
}

export function useExcluirVinculo(obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; etapaId: string }) => vinculosApi.excluir(args.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vinculos", variables.etapaId] });
      queryClient.invalidateQueries({ queryKey: ["etapas", obraId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] });
    },
  });
}