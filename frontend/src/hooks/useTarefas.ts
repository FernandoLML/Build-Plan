// Caminho: /frontend/src/hooks/useTarefas.ts
// Hooks TanStack Query de Tarefas (M3).
//
// Invalidação em cascata: toda mutação de tarefa afeta
//   ['tarefas', etapaId]  → lista da etapa
//   ['etapas', obraId]    → progresso agregado da etapa (GET /obras/:id/etapas)
//   ['dashboard', obraId] → KPI progressoTarefas
// A troca rápida de status também aplica atualização otimista na lista.

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { tarefasApi } from "@/api/tarefas";
import type {
  CreateTarefaPayload,
  StatusTarefa,
  Tarefa,
  UpdateTarefaPayload,
} from "@/types/tarefa";

export const tarefasKey = (etapaId: string | null) => ["tarefas", etapaId] as const;

function invalidarCascata(queryClient: QueryClient, etapaId: string, obraId: string | null) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: tarefasKey(etapaId) }),
    queryClient.invalidateQueries({ queryKey: ["etapas", obraId] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard", obraId] }),
  ]);
}

export function useTarefas(etapaId: string | null) {
  return useQuery({
    queryKey: tarefasKey(etapaId),
    queryFn: () => tarefasApi.listarPorEtapa(etapaId as string),
    enabled: !!etapaId,
  });
}

export function useCriarTarefa(etapaId: string, obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTarefaPayload) => tarefasApi.criar(etapaId, payload),
    onSuccess: () => invalidarCascata(queryClient, etapaId, obraId),
  });
}

export function useAtualizarTarefa(etapaId: string, obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateTarefaPayload }) =>
      tarefasApi.atualizar(args.id, args.payload),
    onSuccess: () => invalidarCascata(queryClient, etapaId, obraId),
  });
}

export function useExcluirTarefa(etapaId: string, obraId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tarefasApi.excluir(id),
    onSuccess: () => invalidarCascata(queryClient, etapaId, obraId),
  });
}

/**
 * Alternância rápida de status com atualização otimista: a lista (e, portanto,
 * a barra de progresso calculada a partir dela) muda imediatamente; em erro, o
 * snapshot anterior é restaurado. Ao final, a cascata é revalidada no servidor
 * (que preenche dataConclusao ao concluir e a limpa ao reabrir).
 */
export function useAlterarStatusTarefa(etapaId: string, obraId: string | null) {
  const queryClient = useQueryClient();
  const key = tarefasKey(etapaId);

  return useMutation({
    mutationFn: (args: { id: string; status: StatusTarefa }) =>
      tarefasApi.atualizar(args.id, { status: args.status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const anterior = queryClient.getQueryData<Tarefa[]>(key);
      if (anterior) {
        queryClient.setQueryData<Tarefa[]>(
          key,
          anterior.map((t) => (t.id === id ? { ...t, status } : t)),
        );
      }
      return { anterior };
    },
    onError: (_erro, _vars, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(key, contexto.anterior);
    },
    onSettled: () => invalidarCascata(queryClient, etapaId, obraId),
  });
}
