// Caminho: /frontend/src/hooks/useMateriais.ts
// Hooks TanStack Query da Tela 4: materiais, etapas (p/ seleção) e vínculos.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { etapasApi, materiaisApi, vinculosApi } from "@/api/materiais";
import type { CreateEtapaPayload } from "@/types/etapa";
import type { CreateVinculoPayload, UpdateMaterialPayload } from "@/types/material";

// ---- Materiais ----
export function useMateriais(obraId: string | null) {
  return useQuery({
    queryKey: ["materiais", obraId],
    queryFn: () => materiaisApi.listar(obraId as string),
    enabled: !!obraId,
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