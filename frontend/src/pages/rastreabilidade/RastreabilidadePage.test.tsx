// Caminho: /frontend/src/pages/rastreabilidade/RastreabilidadePage.test.tsx
// Testes da Tela 6 + máquina de estados RN01 (PREVISTO → RECEBIDO → APLICADO).
// Mocka a obra ativa e a camada de API; os hooks reais rodam sobre um
// QueryClient de teste (ver src/test/utils.tsx).

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderComProviders } from "@/test/utils";
import { RastreabilidadePage } from "./RastreabilidadePage";
import type { EtapaComProgresso } from "@/types/etapa";
import type { Material, StatusVinculo, VinculoMaterialEtapa } from "@/types/material";

// --- Obra ativa fixa ---
vi.mock("@/contexts/useObraAtiva", () => ({
  useObraAtiva: () => ({
    obraAtivaId: "obra-1",
    selecionarObra: vi.fn(),
    limparObraAtiva: vi.fn(),
  }),
}));

// --- Camada de API (materiais/etapas/vínculos e rastreabilidade) ---
vi.mock("@/api/materiais", () => ({
  materiaisApi: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
  etapasApi: { listar: vi.fn(), criar: vi.fn() },
  vinculosApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), excluir: vi.fn() },
}));
vi.mock("@/api/rastreabilidade", () => ({
  rastreabilidadeApi: { atualizarStatus: vi.fn(), listarLogs: vi.fn() },
}));

import { etapasApi, vinculosApi } from "@/api/materiais";
import { rastreabilidadeApi } from "@/api/rastreabilidade";

// --- Fábricas de dados ---
function material(id: string, nome: string): Material {
  return {
    id,
    nome,
    especificacao: null,
    unidade: "un",
    quantidade: "10",
    origem: "MANUAL",
    codigoSinapi: null,
    obraId: "obra-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function vinculo(id: string, status: StatusVinculo, mat: Material): VinculoMaterialEtapa {
  return {
    id,
    materialId: mat.id,
    etapaId: "etapa-1",
    quantidade: "10",
    status,
    local: null,
    dataRecebimento: null,
    dataAplicacao: null,
    material: mat,
  };
}

const etapa: EtapaComProgresso = {
  id: "etapa-1",
  nome: "Fundação",
  descricao: null,
  ordem: 0,
  obraId: "obra-1",
  totalTarefas: 0,
  tarefasConcluidas: 0,
  progresso: 0,
};

const vinculos: VinculoMaterialEtapa[] = [
  vinculo("v-prev", "PREVISTO", material("m1", "Cimento CP-II")),
  vinculo("v-receb", "RECEBIDO", material("m2", "Vergalhão 10mm")),
  vinculo("v-aplic", "APLICADO", material("m3", "Brita 1")),
];

describe("RastreabilidadePage (RN01)", () => {
  beforeEach(() => {
    vi.mocked(etapasApi.listar).mockResolvedValue([etapa]);
    vi.mocked(vinculosApi.listarPorEtapa).mockResolvedValue(vinculos);
    vi.mocked(rastreabilidadeApi.listarLogs).mockResolvedValue([]);
  });

  it("renderiza a lista de vínculos com os respectivos StatusBadges", async () => {
    renderComProviders(<RastreabilidadePage />);

    expect(await screen.findByText("Cimento CP-II")).toBeInTheDocument();
    expect(screen.getByText("Vergalhão 10mm")).toBeInTheDocument();
    expect(screen.getByText("Brita 1")).toBeInTheDocument();

    // Badges (texto exato = só o badge; os botões têm texto "Mudar p/ …").
    expect(screen.getByText("Previsto")).toBeInTheDocument();
    expect(screen.getByText("Recebido")).toBeInTheDocument();
    expect(screen.getByText("Aplicado")).toBeInTheDocument();
  });

  it("oferece apenas a transição válida seguinte (um passo por vez) e trava o estado terminal", async () => {
    renderComProviders(<RastreabilidadePage />);
    await screen.findByText("Cimento CP-II");

    // PREVISTO → só "Recebido"; RECEBIDO → só "Aplicado".
    expect(screen.getByRole("button", { name: "Mudar p/ Recebido" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mudar p/ Aplicado" })).toBeInTheDocument();

    // Exatamente duas transições possíveis (nada para o estado APLICADO).
    expect(screen.getAllByRole("button", { name: /^Mudar p\// })).toHaveLength(2);

    // APLICADO é terminal: sem botão, exibe "Concluído".
    expect(screen.getByText("Concluído")).toBeInTheDocument();
  });

  it("abre o modal de alteração ao clicar na transição, com a observação (RN01)", async () => {
    const user = userEvent.setup();
    renderComProviders(<RastreabilidadePage />);
    await screen.findByText("Cimento CP-II");

    await user.click(screen.getByRole("button", { name: "Mudar p/ Recebido" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Avançar status")).toBeInTheDocument();
    // Transição exibida no cabeçalho do modal.
    expect(within(dialog).getByText(/Previsto → Recebido/)).toBeInTheDocument();
    // Campo de observação da transição.
    expect(within(dialog).getByText(/Observação/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Confirmar: Recebido/ })).toBeInTheDocument();
  });
});