// Caminho: /frontend/src/components/cronograma/TarefaFormDialog.test.tsx
// Modal de tarefa: validação, criação (payload ISO), edição e erro da API.

import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";

import { renderComProviders } from "@/test/utils";
import { TarefaFormDialog } from "./TarefaFormDialog";
import { montarPayloadEdicaoTarefa, montarPayloadTarefa } from "@/lib/tarefas";
import type { Tarefa } from "@/types/tarefa";

vi.mock("@/api/tarefas", () => ({
  tarefasApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
import { tarefasApi } from "@/api/tarefas";

const tarefaExistente: Tarefa = {
  id: "t1",
  titulo: "Concretagem",
  descricao: "Laje do térreo",
  status: "EM_ANDAMENTO",
  dataInicioPrev: "2026-09-01T12:00:00.000Z",
  dataFimPrev: "2026-09-10T12:00:00.000Z",
  dataConclusao: null,
  ordem: 0,
  etapaId: "etapa-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function abrir(tarefa?: Tarefa) {
  const onOpenChange = vi.fn();
  renderComProviders(
    <TarefaFormDialog open onOpenChange={onOpenChange} etapaId="etapa-1" obraId="obra-1" tarefa={tarefa} />,
  );
  return { onOpenChange };
}

describe("montarPayloadTarefa", () => {
  it("omite campos vazios e converte datas para ISO", () => {
    expect(
      montarPayloadTarefa({ titulo: "  Alvenaria ", descricao: "  ", status: "PENDENTE", dataInicioPrev: "", dataFimPrev: "2026-10-01" }),
    ).toEqual({ titulo: "Alvenaria", status: "PENDENTE", dataFimPrev: "2026-10-01T12:00:00.000Z" });
  });
});

describe("montarPayloadEdicaoTarefa", () => {
  it("envia null para descrição e datas apagadas (para o backend limpar)", () => {
    expect(
      montarPayloadEdicaoTarefa({ titulo: " Alvenaria ", descricao: "  ", status: "PENDENTE", dataInicioPrev: "", dataFimPrev: undefined }),
    ).toEqual({ titulo: "Alvenaria", status: "PENDENTE", descricao: null, dataInicioPrev: null, dataFimPrev: null });
  });

  it("converte as datas preenchidas para ISO", () => {
    expect(
      montarPayloadEdicaoTarefa({ titulo: "Laje", descricao: "Térreo", status: "CONCLUIDA", dataInicioPrev: "2026-09-01", dataFimPrev: "2026-09-10" }),
    ).toEqual({
      titulo: "Laje",
      status: "CONCLUIDA",
      descricao: "Térreo",
      dataInicioPrev: "2026-09-01T12:00:00.000Z",
      dataFimPrev: "2026-09-10T12:00:00.000Z",
    });
  });
});

describe("TarefaFormDialog", () => {
  it("valida o título mínimo antes de enviar", async () => {
    const user = userEvent.setup();
    abrir();
    await user.type(screen.getByLabelText("Título"), "ab");
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    expect(await screen.findByText("O título deve ter ao menos 3 caracteres.")).toBeInTheDocument();
    expect(tarefasApi.criar).not.toHaveBeenCalled();
  });

  it("rejeita término anterior ao início", async () => {
    const user = userEvent.setup();
    abrir();
    await user.type(screen.getByLabelText("Título"), "Fundação");
    await user.type(screen.getByLabelText("Início previsto"), "2026-09-10");
    await user.type(screen.getByLabelText("Término previsto"), "2026-09-01");
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    expect(await screen.findByText("O término deve ser igual ou posterior ao início.")).toBeInTheDocument();
    expect(tarefasApi.criar).not.toHaveBeenCalled();
  });

  it("cria a tarefa com o payload esperado e fecha o modal", async () => {
    vi.mocked(tarefasApi.criar).mockResolvedValue({ ...tarefaExistente, id: "novo" });
    const user = userEvent.setup();
    const { onOpenChange } = abrir();

    await user.type(screen.getByLabelText("Título"), "Escavação");
    await user.selectOptions(screen.getByLabelText("Status"), "EM_ANDAMENTO");
    await user.type(screen.getByLabelText("Início previsto"), "2026-09-07");
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() =>
      expect(tarefasApi.criar).toHaveBeenCalledWith("etapa-1", {
        titulo: "Escavação",
        status: "EM_ANDAMENTO",
        dataInicioPrev: "2026-09-07T12:00:00.000Z",
      }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("pré-preenche e salva a edição via PUT", async () => {
    vi.mocked(tarefasApi.atualizar).mockResolvedValue(tarefaExistente);
    const user = userEvent.setup();
    const { onOpenChange } = abrir(tarefaExistente);

    expect(screen.getByText("Editar tarefa")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Concretagem");
    expect(screen.getByLabelText("Status")).toHaveValue("EM_ANDAMENTO");
    expect(screen.getByLabelText("Início previsto")).toHaveValue("2026-09-01");

    await user.clear(screen.getByLabelText("Título"));
    await user.type(screen.getByLabelText("Título"), "Concretagem da laje");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(tarefasApi.atualizar).toHaveBeenCalledWith("t1", {
        titulo: "Concretagem da laje",
        descricao: "Laje do térreo",
        status: "EM_ANDAMENTO",
        dataInicioPrev: "2026-09-01T12:00:00.000Z",
        dataFimPrev: "2026-09-10T12:00:00.000Z",
      }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("envia null ao apagar as datas e a descrição na edição", async () => {
    vi.mocked(tarefasApi.atualizar).mockResolvedValue(tarefaExistente);
    const user = userEvent.setup();
    abrir(tarefaExistente);

    await user.clear(screen.getByLabelText("Início previsto"));
    await user.clear(screen.getByLabelText("Término previsto"));
    await user.clear(screen.getByLabelText("Descrição (opcional)"));
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(tarefasApi.atualizar).toHaveBeenCalledWith("t1", {
        titulo: "Concretagem",
        descricao: null,
        status: "EM_ANDAMENTO",
        dataInicioPrev: null,
        dataFimPrev: null,
      }),
    );
  });

  it("exibe a mensagem de erro retornada pela API", async () => {
    const erro = new AxiosError("bad", "400", undefined, undefined, {
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: "Etapa não encontrada." },
    });
    vi.mocked(tarefasApi.criar).mockRejectedValue(erro);
    const user = userEvent.setup();
    const { onOpenChange } = abrir();

    await user.type(screen.getByLabelText("Título"), "Escavação");
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Etapa não encontrada.");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("usa mensagem padrão para erros que não são da API", async () => {
    vi.mocked(tarefasApi.atualizar).mockRejectedValue(new Error("rede"));
    const user = userEvent.setup();
    abrir(tarefaExistente);

    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao salvar tarefa.");
  });
});
