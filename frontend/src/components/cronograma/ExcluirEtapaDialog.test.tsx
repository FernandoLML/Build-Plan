// Caminho: /frontend/src/components/cronograma/ExcluirEtapaDialog.test.tsx
// Exclusão de etapa a partir do card do cronograma, com o aviso da RN02
// (materiais vinculados que ficarão sem associação).

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";

import { criarQueryClient, renderComProviders } from "@/test/utils";
import { EtapaTarefasCard } from "./EtapaTarefasCard";
import type { EtapaComProgresso } from "@/types/etapa";

vi.mock("@/api/tarefas", () => ({
  tarefasApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
vi.mock("@/api/materiais", () => ({
  etapasApi: { listar: vi.fn(), criar: vi.fn(), excluir: vi.fn() },
  materiaisApi: {},
  vinculosApi: {},
}));
import { tarefasApi } from "@/api/tarefas";
import { etapasApi } from "@/api/materiais";

const etapa: EtapaComProgresso = {
  id: "etapa-1",
  nome: "Fundação",
  descricao: null,
  ordem: 0,
  obraId: "obra-1",
  totalTarefas: 0,
  tarefasConcluidas: 0,
  progresso: 0,
  totalMateriaisVinculados: 0,
};

async function abrirDialogo(over: Partial<EtapaComProgresso> = {}) {
  const user = userEvent.setup();
  const client = criarQueryClient();
  renderComProviders(<EtapaTarefasCard etapa={{ ...etapa, ...over }} obraId="obra-1" />, { client });
  await user.click(screen.getByRole("button", { name: "Excluir a etapa Fundação" }));
  return { user, client, dialogo: await screen.findByRole("dialog") };
}

beforeEach(() => {
  vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue([]);
});

describe("ExcluirEtapaDialog", () => {
  it("avisa quantos materiais vinculados ficarão sem associação (RN02)", async () => {
    const { dialogo } = await abrirDialogo({ totalMateriaisVinculados: 3, totalTarefas: 2 });

    expect(within(dialogo).getByText('Excluir a etapa "Fundação"?')).toBeInTheDocument();
    expect(within(dialogo).getByRole("alert")).toHaveTextContent(
      "3 materiais vinculados a esta etapa ficarão sem associação.",
    );
    expect(within(dialogo).getByText("2 tarefas desta etapa também serão excluídas.")).toBeInTheDocument();
  });

  it("usa o singular para um material e uma tarefa", async () => {
    const { dialogo } = await abrirDialogo({ totalMateriaisVinculados: 1, totalTarefas: 1 });

    expect(within(dialogo).getByRole("alert")).toHaveTextContent(
      "1 material vinculado a esta etapa ficará sem associação.",
    );
    expect(within(dialogo).getByText("1 tarefa desta etapa também será excluída.")).toBeInTheDocument();
  });

  it("não mostra avisos para etapa sem materiais nem tarefas", async () => {
    const { dialogo } = await abrirDialogo();

    expect(within(dialogo).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(dialogo).queryByText(/também/)).not.toBeInTheDocument();
  });

  it("exclui ao confirmar, fecha o diálogo e revalida as etapas", async () => {
    vi.mocked(etapasApi.excluir).mockResolvedValue(undefined);
    const { user, client, dialogo } = await abrirDialogo({ totalMateriaisVinculados: 2 });
    const invalidar = vi.spyOn(client, "invalidateQueries");

    await user.click(within(dialogo).getByRole("button", { name: "Excluir etapa" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(etapasApi.excluir).toHaveBeenCalledWith("etapa-1");
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["etapas", "obra-1"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["dashboard", "obra-1"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["listas-compras", "obra-1"] });
  });

  it("cancelar fecha sem excluir", async () => {
    const { user, dialogo } = await abrirDialogo();

    await user.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(etapasApi.excluir).not.toHaveBeenCalled();
  });

  it("mantém o diálogo aberto e mostra o erro se a API falhar", async () => {
    const resposta = { status: 404, data: { message: "Etapa não encontrada." } } as AxiosResponse;
    vi.mocked(etapasApi.excluir).mockRejectedValue(
      new AxiosError("erro", "ERR_BAD_REQUEST", undefined, undefined, resposta),
    );
    const { user, dialogo } = await abrirDialogo();

    await user.click(within(dialogo).getByRole("button", { name: "Excluir etapa" }));

    expect(await within(dialogo).findByText("Etapa não encontrada.")).toBeInTheDocument();
  });
});
