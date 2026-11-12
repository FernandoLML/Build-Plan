// Caminho: /frontend/src/hooks/useTarefas.test.tsx
// Hooks de tarefas: consulta, invalidação em cascata e atualização otimista.

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  tarefasKey,
  useAlterarStatusTarefa,
  useAtualizarTarefa,
  useCriarTarefa,
  useExcluirTarefa,
  useTarefas,
} from "./useTarefas";
import type { Tarefa } from "@/types/tarefa";

vi.mock("@/api/tarefas", () => ({
  tarefasApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
import { tarefasApi } from "@/api/tarefas";

function tarefa(id: string, over: Partial<Tarefa> = {}): Tarefa {
  return {
    id,
    titulo: `Tarefa ${id}`,
    descricao: null,
    status: "PENDENTE",
    dataInicioPrev: null,
    dataFimPrev: null,
    dataConclusao: null,
    ordem: 0,
    etapaId: "etapa-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function setup() {
  // gcTime padrão: dados semeados via setQueryData não podem ser coletados no meio do teste.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidar = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidar, wrapper };
}

function chavesInvalidadas(invalidar: ReturnType<typeof setup>["invalidar"]) {
  return invalidar.mock.calls.map(([filtros]) => (filtros as { queryKey: unknown[] }).queryKey);
}

const CASCATA = [["tarefas", "etapa-1"], ["etapas", "obra-1"], ["dashboard", "obra-1"]];

describe("useTarefas", () => {
  beforeEach(() => {
    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue([tarefa("t1")]);
  });

  it("lista as tarefas da etapa", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useTarefas("etapa-1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(tarefasApi.listarPorEtapa).toHaveBeenCalledWith("etapa-1");
  });

  it("não consulta sem etapa", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useTarefas(null), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(tarefasApi.listarPorEtapa).not.toHaveBeenCalled();
  });
});

describe("mutações — invalidação em cascata", () => {
  it("criar invalida tarefas, etapas e dashboard", async () => {
    vi.mocked(tarefasApi.criar).mockResolvedValue(tarefa("novo"));
    const { wrapper, invalidar } = setup();
    const { result } = renderHook(() => useCriarTarefa("etapa-1", "obra-1"), { wrapper });

    await act(() => result.current.mutateAsync({ titulo: "Nova" }));

    expect(tarefasApi.criar).toHaveBeenCalledWith("etapa-1", { titulo: "Nova" });
    expect(chavesInvalidadas(invalidar)).toEqual(expect.arrayContaining(CASCATA));
  });

  it("atualizar invalida a cascata", async () => {
    vi.mocked(tarefasApi.atualizar).mockResolvedValue(tarefa("t1"));
    const { wrapper, invalidar } = setup();
    const { result } = renderHook(() => useAtualizarTarefa("etapa-1", "obra-1"), { wrapper });

    await act(() => result.current.mutateAsync({ id: "t1", payload: { titulo: "Editada" } }));

    expect(tarefasApi.atualizar).toHaveBeenCalledWith("t1", { titulo: "Editada" });
    expect(chavesInvalidadas(invalidar)).toEqual(expect.arrayContaining(CASCATA));
  });

  it("excluir invalida a cascata", async () => {
    vi.mocked(tarefasApi.excluir).mockResolvedValue(undefined);
    const { wrapper, invalidar } = setup();
    const { result } = renderHook(() => useExcluirTarefa("etapa-1", "obra-1"), { wrapper });

    await act(() => result.current.mutateAsync("t1"));

    expect(tarefasApi.excluir).toHaveBeenCalledWith("t1");
    expect(chavesInvalidadas(invalidar)).toEqual(expect.arrayContaining(CASCATA));
  });
});

describe("useAlterarStatusTarefa", () => {
  it("aplica atualização otimista e invalida a cascata ao final", async () => {
    let resolver!: (t: Tarefa) => void;
    vi.mocked(tarefasApi.atualizar).mockReturnValue(new Promise<Tarefa>((r) => (resolver = r)));
    const { client, wrapper, invalidar } = setup();
    client.setQueryData(tarefasKey("etapa-1"), [tarefa("t1"), tarefa("t2")]);

    const { result } = renderHook(() => useAlterarStatusTarefa("etapa-1", "obra-1"), { wrapper });
    act(() => result.current.mutate({ id: "t1", status: "CONCLUIDA" }));

    await waitFor(() =>
      expect(client.getQueryData<Tarefa[]>(tarefasKey("etapa-1"))?.[0].status).toBe("CONCLUIDA"),
    );
    expect(client.getQueryData<Tarefa[]>(tarefasKey("etapa-1"))?.[1].status).toBe("PENDENTE");
    expect(tarefasApi.atualizar).toHaveBeenCalledWith("t1", { status: "CONCLUIDA" });

    resolver(tarefa("t1", { status: "CONCLUIDA" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(chavesInvalidadas(invalidar)).toEqual(expect.arrayContaining(CASCATA));
  });

  it("restaura o snapshot anterior em caso de erro", async () => {
    vi.mocked(tarefasApi.atualizar).mockRejectedValue(new Error("falha"));
    const { client, wrapper } = setup();
    // Sem observers ativos, a invalidação não refaz a consulta — o snapshot fica visível.
    client.setQueryData(tarefasKey("etapa-1"), [tarefa("t1", { status: "EM_ANDAMENTO" })]);

    const { result } = renderHook(() => useAlterarStatusTarefa("etapa-1", "obra-1"), { wrapper });
    act(() => result.current.mutate({ id: "t1", status: "BLOQUEADA" }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData<Tarefa[]>(tarefasKey("etapa-1"))?.[0].status).toBe("EM_ANDAMENTO");
  });

  it("funciona mesmo sem a lista em cache", async () => {
    vi.mocked(tarefasApi.atualizar).mockResolvedValue(tarefa("t1", { status: "EM_ANDAMENTO" }));
    const { wrapper } = setup();
    const { result } = renderHook(() => useAlterarStatusTarefa("etapa-1", "obra-1"), { wrapper });

    await act(() => result.current.mutateAsync({ id: "t1", status: "EM_ANDAMENTO" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
