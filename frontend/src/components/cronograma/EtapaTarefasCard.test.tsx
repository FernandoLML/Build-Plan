// Caminho: /frontend/src/components/cronograma/EtapaTarefasCard.test.tsx
// Card da etapa: estados de renderização, progresso físico, transição rápida
// de status (4 estados), criação e exclusão de tarefa.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderComProviders } from "@/test/utils";
import { EtapaTarefasCard } from "./EtapaTarefasCard";
import { estaAtrasada } from "@/lib/tarefas";
import type { EtapaComProgresso } from "@/types/etapa";
import type { StatusTarefa, Tarefa } from "@/types/tarefa";

vi.mock("@/api/tarefas", () => ({
  tarefasApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
import { tarefasApi } from "@/api/tarefas";

function tarefa(id: string, titulo: string, status: StatusTarefa, over: Partial<Tarefa> = {}): Tarefa {
  return {
    id,
    titulo,
    descricao: null,
    status,
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

const etapa: EtapaComProgresso = {
  id: "etapa-1",
  nome: "Fundação",
  descricao: null,
  ordem: 0,
  obraId: "obra-1",
  totalTarefas: 4,
  tarefasConcluidas: 1,
  progresso: 25,
};

const tarefas: Tarefa[] = [
  tarefa("t1", "Locação da obra", "CONCLUIDA", {
    dataInicioPrev: "2026-09-01T12:00:00.000Z",
    dataFimPrev: "2026-09-03T12:00:00.000Z",
    dataConclusao: "2026-09-02T15:00:00.000Z",
  }),
  tarefa("t2", "Escavação", "EM_ANDAMENTO"),
  tarefa("t3", "Armação", "PENDENTE"),
  tarefa("t4", "Concretagem", "BLOQUEADA", { descricao: "Aguardando bomba" }),
];

const render = (e: EtapaComProgresso = etapa) =>
  renderComProviders(<EtapaTarefasCard etapa={e} obraId="obra-1" />);

describe("EtapaTarefasCard — renderização", () => {
  beforeEach(() => {
    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue(tarefas);
  });

  it("lista as tarefas com badges dos 4 status e datas", async () => {
    render();

    const item = await screen.findByTestId("tarefa-t1");
    expect(within(item).getByText("Concluída")).toHaveAttribute("data-status", "CONCLUIDA");
    expect(within(item).getByText("01/09/2026")).toBeInTheDocument();
    expect(within(item).getByText("03/09/2026")).toBeInTheDocument();
    expect(within(item).getByText("02/09/2026")).toBeInTheDocument(); // concluída em

    expect(within(screen.getByTestId("tarefa-t2")).getByText("Em andamento")).toBeInTheDocument();
    expect(within(screen.getByTestId("tarefa-t3")).getByText("Pendente")).toBeInTheDocument();
    expect(within(screen.getByTestId("tarefa-t4")).getByText("Bloqueada")).toBeInTheDocument();
    expect(screen.getByText("Aguardando bomba")).toBeInTheDocument();
  });

  it("calcula o progresso físico a partir das tarefas carregadas", async () => {
    render();
    await screen.findByTestId("tarefa-t1");
    expect(screen.getByTestId("progresso-etapa-1")).toHaveTextContent("1 de 4 tarefas concluídas • 25%");
  });

  it("exibe estado vazio e 0% para etapa sem tarefas", async () => {
    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue([]);
    render({ ...etapa, totalTarefas: 0, tarefasConcluidas: 0, progresso: 0 });

    expect(await screen.findByText("Nenhuma tarefa nesta etapa.")).toBeInTheDocument();
    expect(screen.getByTestId("progresso-etapa-1")).toHaveTextContent("Sem tarefas • 0%");
  });

  it("usa o agregado do backend enquanto a lista carrega", () => {
    vi.mocked(tarefasApi.listarPorEtapa).mockReturnValue(new Promise(() => {}));
    render({ ...etapa, totalTarefas: 2, tarefasConcluidas: 1, progresso: 50 });
    expect(screen.getByTestId("progresso-etapa-1")).toHaveTextContent("1 de 2 tarefas concluídas • 50%");
  });

  it("exibe erro com opção de tentar novamente", async () => {
    vi.mocked(tarefasApi.listarPorEtapa).mockRejectedValueOnce(new Error("x"));
    const user = userEvent.setup();
    render();

    expect(await screen.findByText("Não foi possível carregar as tarefas.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByTestId("tarefa-t1")).toBeInTheDocument();
  });

  it("recolhe e expande a lista de tarefas", async () => {
    const user = userEvent.setup();
    render();
    await screen.findByTestId("tarefa-t1");

    await user.click(screen.getByRole("button", { name: /Fundação/ }));
    expect(screen.queryByTestId("tarefa-t1")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Fundação/ }));
    expect(screen.getByTestId("tarefa-t1")).toBeInTheDocument();
  });
});

describe("EtapaTarefasCard — transição de status", () => {
  beforeEach(() => {
    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue(tarefas);
  });

  it("marca o status atual como pressionado e desabilitado", async () => {
    render();
    const grupo = await screen.findByRole("group", { name: "Alterar status de Armação" });
    const atual = within(grupo).getByRole("button", { name: "Marcar como Pendente" });
    expect(atual).toHaveAttribute("aria-pressed", "true");
    expect(atual).toBeDisabled();
    expect(within(grupo).getByRole("button", { name: "Marcar como Concluída" })).toBeEnabled();
  });

  it.each<[StatusTarefa, string]>([
    ["EM_ANDAMENTO", "Em andamento"],
    ["CONCLUIDA", "Concluída"],
    ["BLOQUEADA", "Bloqueada"],
  ])("PENDENTE → %s envia PUT e atualiza o progresso otimista", async (status, label) => {
    vi.mocked(tarefasApi.atualizar).mockReturnValue(new Promise(() => {})); // mantém otimista
    const user = userEvent.setup();
    render();

    const grupo = await screen.findByRole("group", { name: "Alterar status de Armação" });
    await user.click(within(grupo).getByRole("button", { name: `Marcar como ${label}` }));

    expect(tarefasApi.atualizar).toHaveBeenCalledWith("t3", { status });
    await waitFor(() =>
      expect(within(screen.getByTestId("tarefa-t3")).getByText(label)).toHaveAttribute("data-status", status),
    );
    const esperado = status === "CONCLUIDA" ? "2 de 4 tarefas concluídas • 50%" : "1 de 4 tarefas concluídas • 25%";
    expect(screen.getByTestId("progresso-etapa-1")).toHaveTextContent(esperado);
  });

  it("CONCLUIDA → PENDENTE reduz o progresso e oculta a data de conclusão", async () => {
    vi.mocked(tarefasApi.atualizar).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render();

    const grupo = await screen.findByRole("group", { name: "Alterar status de Locação da obra" });
    await user.click(within(grupo).getByRole("button", { name: "Marcar como Pendente" }));

    await waitFor(() =>
      expect(screen.getByTestId("progresso-etapa-1")).toHaveTextContent("0 de 4 tarefas concluídas • 0%"),
    );
    expect(within(screen.getByTestId("tarefa-t1")).queryByText(/Concluída em/)).not.toBeInTheDocument();
  });

  it("revalida a lista após a resposta do servidor", async () => {
    vi.mocked(tarefasApi.atualizar).mockResolvedValue(tarefas[2]);
    const user = userEvent.setup();
    render();

    const grupo = await screen.findByRole("group", { name: "Alterar status de Armação" });
    await user.click(within(grupo).getByRole("button", { name: "Marcar como Concluída" }));

    await waitFor(() => expect(tarefasApi.listarPorEtapa).toHaveBeenCalledTimes(2));
  });
});

describe("EtapaTarefasCard — criação e exclusão", () => {
  beforeEach(() => {
    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue(tarefas);
  });

  it("cria tarefa pelo modal e recarrega a lista", async () => {
    const nova = tarefa("t5", "Impermeabilização", "PENDENTE");
    vi.mocked(tarefasApi.criar).mockResolvedValue(nova);
    const user = userEvent.setup();
    render();
    await screen.findByTestId("tarefa-t1");

    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue([...tarefas, nova]);
    await user.click(screen.getByRole("button", { name: "Nova tarefa" }));
    await user.type(await screen.findByLabelText("Título"), "Impermeabilização");
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() =>
      expect(tarefasApi.criar).toHaveBeenCalledWith("etapa-1", { titulo: "Impermeabilização", status: "PENDENTE" }),
    );
    expect(await screen.findByTestId("tarefa-t5")).toBeInTheDocument();
    expect(screen.getByTestId("progresso-etapa-1")).toHaveTextContent("1 de 5 tarefas concluídas • 20%");
  });

  it("abre o modal de edição com a tarefa selecionada", async () => {
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole("button", { name: "Editar Escavação" }));
    expect(await screen.findByText("Editar tarefa")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Escavação");
  });

  it("exclui a tarefa após confirmação", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(tarefasApi.excluir).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render();
    await screen.findByTestId("tarefa-t4");

    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue(tarefas.slice(0, 3));
    await user.click(screen.getByRole("button", { name: "Excluir Concretagem" }));

    expect(window.confirm).toHaveBeenCalledWith('Excluir a tarefa "Concretagem"?');
    expect(tarefasApi.excluir).toHaveBeenCalledWith("t4");
    await waitFor(() => expect(screen.queryByTestId("tarefa-t4")).not.toBeInTheDocument());
    expect(screen.getByTestId("progresso-etapa-1")).toHaveTextContent("1 de 3 tarefas concluídas • 33%");
  });

  it("não exclui quando o usuário cancela", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render();
    await user.click(await screen.findByRole("button", { name: "Excluir Concretagem" }));
    expect(tarefasApi.excluir).not.toHaveBeenCalled();
  });
});

describe("estaAtrasada", () => {
  const hoje = new Date("2026-09-15T12:00:00.000Z");

  it("é atrasada quando o término passou e não está concluída", () => {
    expect(estaAtrasada(tarefa("a", "A", "EM_ANDAMENTO", { dataFimPrev: "2026-09-10T12:00:00.000Z" }), hoje)).toBe(true);
  });

  it("não é atrasada se concluída, sem término ou no prazo", () => {
    expect(estaAtrasada(tarefa("a", "A", "CONCLUIDA", { dataFimPrev: "2026-09-10T12:00:00.000Z" }), hoje)).toBe(false);
    expect(estaAtrasada(tarefa("a", "A", "PENDENTE"), hoje)).toBe(false);
    expect(estaAtrasada(tarefa("a", "A", "PENDENTE", { dataFimPrev: "2026-09-15T12:00:00.000Z" }), hoje)).toBe(false);
  });
});
