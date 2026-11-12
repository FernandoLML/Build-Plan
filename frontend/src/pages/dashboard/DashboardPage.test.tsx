// Caminho: /frontend/src/pages/dashboard/DashboardPage.test.tsx
// Tela 2 — Dashboard: progresso físico (tarefas), suprimentos por etapa
// (agregação dos vínculos em cache), skeleton durante o carregamento e alertas.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { renderComProviders } from "@/test/utils";
import { DashboardPage } from "./DashboardPage";
import type { DashboardObra } from "@/types/dashboard";
import type { EtapaComProgresso } from "@/types/etapa";
import type { Material, StatusVinculo, VinculoMaterialEtapa } from "@/types/material";

const obraAtiva = vi.hoisted(() => ({ id: "obra-1" as string | null }));
vi.mock("@/contexts/useObraAtiva", () => ({
  useObraAtiva: () => ({ obraAtivaId: obraAtiva.id, selecionarObra: vi.fn(), limparObraAtiva: vi.fn() }),
}));
vi.mock("@/api/dashboard", () => ({ dashboardApi: { obter: vi.fn() } }));
vi.mock("@/api/materiais", () => ({
  materiaisApi: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
  etapasApi: { listar: vi.fn(), criar: vi.fn() },
  vinculosApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), excluir: vi.fn() },
}));

import { dashboardApi } from "@/api/dashboard";
import { etapasApi, vinculosApi } from "@/api/materiais";

// --- Fábricas de dados ---
function etapa(id: string, nome: string, ordem: number): EtapaComProgresso {
  return { id, nome, descricao: null, ordem, obraId: "obra-1", totalTarefas: 0, tarefasConcluidas: 0, progresso: 0 };
}

function material(nome: string): Material {
  return {
    id: `mat-${nome}`,
    nome,
    especificacao: null,
    unidade: "kg",
    quantidade: "10",
    origem: "MANUAL",
    codigoSinapi: null,
    obraId: "obra-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function vinculo(id: string, etapaId: string, nome: string, status: StatusVinculo): VinculoMaterialEtapa {
  return {
    id,
    materialId: `mat-${nome}`,
    etapaId,
    quantidade: "5",
    status,
    local: null,
    dataRecebimento: null,
    dataAplicacao: null,
    material: material(nome),
  };
}

function dashboard(): DashboardObra {
  return {
    obraId: "obra-1",
    etapas: { total: 2 },
    materiais: { total: 4 },
    vinculos: {
      total: 4,
      porStatus: {
        PREVISTO: { quantidade: 1, percentual: 25 },
        RECEBIDO: { quantidade: 1, percentual: 25 },
        APLICADO: { quantidade: 2, percentual: 50 },
      },
    },
    progressoTarefas: { total: 4, concluidas: 1, percentual: 25 },
    orcamento: { totalOrcado: "1250.00", itensSemPreco: 3 },
  };
}

// Fundação: 1/1 aplicado (100%). Alvenaria: 1 de 3 aplicados (33%) → "em execução".
const VINCULOS: Record<string, VinculoMaterialEtapa[]> = {
  "etapa-fund": [vinculo("v1", "etapa-fund", "Concreto", "APLICADO")],
  "etapa-alv": [
    vinculo("v2", "etapa-alv", "Tijolo", "APLICADO"),
    vinculo("v3", "etapa-alv", "Argamassa", "RECEBIDO"),
    vinculo("v4", "etapa-alv", "Graute", "PREVISTO"),
  ],
};

describe("DashboardPage", () => {
  beforeEach(() => {
    obraAtiva.id = "obra-1";
    vi.mocked(dashboardApi.obter).mockResolvedValue(dashboard());
    vi.mocked(etapasApi.listar).mockResolvedValue([
      etapa("etapa-alv", "Alvenaria", 2),
      etapa("etapa-fund", "Fundação", 1),
    ]);
    vi.mocked(vinculosApi.listarPorEtapa).mockImplementation(async (id: string) => VINCULOS[id] ?? []);
  });

  it("exibe o progresso físico das tarefas", async () => {
    renderComProviders(<DashboardPage />);
    const card = await screen.findByTestId("dashboard-progresso-fisico");
    expect(within(card).getByText("1 de 4 tarefas concluídas • 25%")).toBeInTheDocument();
  });

  it("calcula os suprimentos por etapa (aplicados / vínculos), na ordem das etapas", async () => {
    renderComProviders(<DashboardPage />);

    const fundacao = await screen.findByText("1 de 1 insumos aplicados • 100%");
    const alvenaria = screen.getByText("1 de 3 insumos aplicados • 33%");
    expect(vinculosApi.listarPorEtapa).toHaveBeenCalledWith("etapa-fund");
    expect(vinculosApi.listarPorEtapa).toHaveBeenCalledWith("etapa-alv");

    // Ordem: Fundação (ordem 1) antes de Alvenaria (ordem 2).
    expect(fundacao.compareDocumentPosition(alvenaria) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("lista os materiais da etapa em execução (primeira com progresso parcial)", async () => {
    renderComProviders(<DashboardPage />);

    expect(await screen.findByText("Tijolo")).toBeInTheDocument();
    expect(screen.getByText("Argamassa")).toBeInTheDocument();
    expect(screen.getByText("Graute")).toBeInTheDocument();
    expect(screen.queryByText("Concreto")).not.toBeInTheDocument(); // etapa 100%
    expect(screen.getByText("· Alvenaria")).toBeInTheDocument();
  });

  it("mostra skeleton (e não 0%) enquanto os vínculos carregam", async () => {
    vi.mocked(vinculosApi.listarPorEtapa).mockImplementation(() => new Promise(() => {})); // nunca resolve
    renderComProviders(<DashboardPage />);

    expect(await screen.findByTestId("suprimentos-carregando")).toBeInTheDocument();
    await screen.findByTestId("dashboard-progresso-fisico"); // dashboard já carregou
    expect(screen.queryByText(/insumos aplicados/)).not.toBeInTheDocument();
  });

  it("exibe os alertas e trata 'já aplicados' como informação, não alerta", async () => {
    renderComProviders(<DashboardPage />);

    expect(await screen.findByText("item(ns) da lista de compras sem preço")).toBeInTheDocument();
    expect(screen.getByText("material(is) previsto(s) ainda não recebido(s)")).toBeInTheDocument();
    const listaAlertas = screen.getByRole("list");
    expect(within(listaAlertas).getAllByRole("listitem")).toHaveLength(2);
    expect(within(listaAlertas).queryByText(/já/)).not.toBeInTheDocument();
    expect(screen.getByText(/material\(is\) já/)).toBeInTheDocument();
  });

  it("orienta a cadastrar etapas quando a obra não tem nenhuma", async () => {
    vi.mocked(etapasApi.listar).mockResolvedValue([]);
    renderComProviders(<DashboardPage />);

    expect(await screen.findByText("Nenhuma etapa cadastrada nesta obra.")).toBeInTheDocument();
    expect(vinculosApi.listarPorEtapa).not.toHaveBeenCalled();
  });

  it("pede para selecionar uma obra quando não há obra ativa", () => {
    obraAtiva.id = null;
    renderComProviders(<DashboardPage />);
    expect(screen.getByText("Nenhuma obra selecionada")).toBeInTheDocument();
    expect(dashboardApi.obter).not.toHaveBeenCalled();
  });
});
