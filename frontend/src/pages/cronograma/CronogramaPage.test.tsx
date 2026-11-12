// Caminho: /frontend/src/pages/cronograma/CronogramaPage.test.tsx
// Tela de Cronograma: obra ativa, estados de carregamento e progresso global.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderComProviders } from "@/test/utils";
import { CronogramaPage } from "./CronogramaPage";
import type { EtapaComProgresso } from "@/types/etapa";

const obraAtiva = vi.hoisted(() => ({ id: "obra-1" as string | null }));
vi.mock("@/contexts/useObraAtiva", () => ({
  useObraAtiva: () => ({ obraAtivaId: obraAtiva.id, selecionarObra: vi.fn(), limparObraAtiva: vi.fn() }),
}));
vi.mock("@/api/materiais", () => ({
  materiaisApi: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
  etapasApi: { listar: vi.fn(), criar: vi.fn() },
  vinculosApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), excluir: vi.fn() },
}));
vi.mock("@/api/tarefas", () => ({
  tarefasApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
import { etapasApi } from "@/api/materiais";
import { tarefasApi } from "@/api/tarefas";

function etapa(id: string, nome: string, ordem: number, total: number, concluidas: number): EtapaComProgresso {
  return {
    id,
    nome,
    descricao: null,
    ordem,
    obraId: "obra-1",
    totalTarefas: total,
    tarefasConcluidas: concluidas,
    progresso: total === 0 ? 0 : Math.round((concluidas / total) * 100),
  };
}

describe("CronogramaPage", () => {
  beforeEach(() => {
    obraAtiva.id = "obra-1";
    vi.mocked(tarefasApi.listarPorEtapa).mockResolvedValue([]);
  });

  it("pede a seleção de obra quando não há obra ativa", () => {
    obraAtiva.id = null;
    renderComProviders(<CronogramaPage />);
    expect(screen.getByText("Nenhuma obra selecionada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para Obras" })).toHaveAttribute("href", "/obras");
  });

  it("exibe estado vazio sem etapas", async () => {
    vi.mocked(etapasApi.listar).mockResolvedValue([]);
    renderComProviders(<CronogramaPage />);
    expect(await screen.findByText("Nenhuma etapa cadastrada")).toBeInTheDocument();
    expect(screen.queryByTestId("progresso-obra")).not.toBeInTheDocument();
  });

  it("renderiza as etapas em ordem com o progresso físico global", async () => {
    vi.mocked(etapasApi.listar).mockResolvedValue([
      etapa("e2", "Estrutura", 1, 3, 0),
      etapa("e1", "Fundação", 0, 1, 1),
    ]);
    renderComProviders(<CronogramaPage />);

    const titulos = await screen.findAllByRole("heading", { level: 2 });
    expect(titulos.map((h) => h.textContent)).toEqual(["Fundação", "Estrutura"]);
    expect(screen.getByTestId("progresso-obra")).toHaveTextContent("1 de 4 tarefas concluídas • 25%");
  });

  it("mostra 0% global quando as etapas não têm tarefas", async () => {
    vi.mocked(etapasApi.listar).mockResolvedValue([etapa("e1", "Fundação", 0, 0, 0)]);
    renderComProviders(<CronogramaPage />);
    expect(await screen.findByTestId("progresso-obra")).toHaveTextContent("0 de 0 tarefas concluídas • 0%");
  });

  it("exibe erro e permite tentar novamente", async () => {
    vi.mocked(etapasApi.listar).mockRejectedValueOnce(new Error("x")).mockResolvedValue([
      etapa("e1", "Fundação", 0, 0, 0),
    ]);
    const user = userEvent.setup();
    renderComProviders(<CronogramaPage />);

    expect(await screen.findByText("Não foi possível carregar as etapas.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Fundação" })).toBeInTheDocument();
  });

  it("abre o modal de nova etapa", async () => {
    vi.mocked(etapasApi.listar).mockResolvedValue([]);
    const user = userEvent.setup();
    renderComProviders(<CronogramaPage />);
    await user.click(screen.getByRole("button", { name: "Nova etapa" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Nova etapa");
  });
});
