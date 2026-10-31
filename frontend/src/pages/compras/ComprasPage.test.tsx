// Caminho: /frontend/src/pages/compras/ComprasPage.test.tsx
// Testes da Tela 5 — Lista de Compras: banner de itens sem cotação, exibição do
// total orçado (snapshot congelado no backend) e cobertura derivada no cliente,
// e abertura do diálogo "Informar preço".

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderComProviders } from "@/test/utils";
import { ComprasPage } from "./ComprasPage";
import type { EtapaComProgresso } from "@/types/etapa";
import type { ItemCompra, ListaCompras } from "@/types/compras";

// --- Obra ativa fixa ---
vi.mock("@/contexts/useObraAtiva", () => ({
  useObraAtiva: () => ({
    obraAtivaId: "obra-1",
    selecionarObra: vi.fn(),
    limparObraAtiva: vi.fn(),
  }),
}));

// --- Camadas de API ---
vi.mock("@/api/compras", () => ({
  comprasApi: {
    listarPorObra: vi.fn(),
    gerarPorEtapa: vi.fn(),
    excluirLista: vi.fn(),
    atualizarItem: vi.fn(),
    excluirItem: vi.fn(),
    exportarCsv: vi.fn(),
  },
}));
vi.mock("@/api/materiais", () => ({
  materiaisApi: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
  etapasApi: { listar: vi.fn(), criar: vi.fn() },
  vinculosApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), excluir: vi.fn() },
}));

import { comprasApi } from "@/api/compras";
import { etapasApi } from "@/api/materiais";

// --- Fábricas de dados ---
function item(
  id: string,
  descricao: string,
  quantidade: string,
  precoUnitario: string | null,
  precoTotal: string | null,
): ItemCompra {
  return {
    id,
    listaComprasId: "lista-1",
    materialId: `mat-${id}`,
    descricao,
    unidade: "sc",
    quantidade,
    precoUnitario,
    precoTotal,
    origemPreco: precoUnitario ? "MANUAL" : "PENDENTE",
    createdAt: "2026-01-01T00:00:00.000Z",
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

// 2 itens cotados (320 + 200) + 1 sem preço → total 520; cobertura 2/3 = 67%.
function listaBase(itensSemPreco: number, itens: ItemCompra[]): ListaCompras {
  return {
    id: "lista-1",
    obraId: "obra-1",
    etapaId: "etapa-1",
    geradaEm: "2026-01-01T00:00:00.000Z",
    itens,
    totais: {
      totalItens: itens.length,
      itensSemPreco,
      totalOrcado: "520.00",
    },
  };
}

const itensComPendencia: ItemCompra[] = [
  item("i1", "Cimento CP-II", "10", "32.00", "320.00"),
  item("i2", "Areia média", "5", "40.00", "200.00"),
  item("i3", "Brita 1", "3", null, null),
];

describe("ComprasPage", () => {
  beforeEach(() => {
    vi.mocked(etapasApi.listar).mockResolvedValue([etapa]);
    vi.mocked(comprasApi.exportarCsv).mockResolvedValue("");
  });

  it("exibe o banner de alerta quando há itens sem cotação de preço", async () => {
    vi.mocked(comprasApi.listarPorObra).mockResolvedValue([listaBase(1, itensComPendencia)]);
    renderComProviders(<ComprasPage />);

    await screen.findByText("Cimento CP-II");
    expect(screen.getByText(/sem preço/i)).toBeInTheDocument();
  });

  it("não exibe o banner quando todos os itens estão cotados", async () => {
    const todosCotados: ItemCompra[] = [
      item("i1", "Cimento CP-II", "10", "32.00", "320.00"),
      item("i2", "Areia média", "5", "40.00", "200.00"),
    ];
    vi.mocked(comprasApi.listarPorObra).mockResolvedValue([listaBase(0, todosCotados)]);
    renderComProviders(<ComprasPage />);

    await screen.findByText("Cimento CP-II");
    expect(screen.queryByText(/sem preço/i)).not.toBeInTheDocument();
  });

  it("exibe o total orçado (só itens cotados) e a cobertura de preços derivada", async () => {
    vi.mocked(comprasApi.listarPorObra).mockResolvedValue([listaBase(1, itensComPendencia)]);
    renderComProviders(<ComprasPage />);

    await screen.findByText("Cimento CP-II");

    // Total = 320 + 200 (o item sem preço não entra). Regex evita o NBSP do Intl.
    expect(screen.getByText(/520,00/)).toBeInTheDocument();
    // Cobertura calculada no cliente: round((3 - 1) / 3 * 100) = 67%.
    expect(screen.getByText("67%")).toBeInTheDocument();
    // Item sem preço: "—" em Preço unit. e Subtotal.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("abre o diálogo de inserção de preço ao clicar em 'Precificar'", async () => {
    const user = userEvent.setup();
    vi.mocked(comprasApi.listarPorObra).mockResolvedValue([listaBase(1, itensComPendencia)]);
    renderComProviders(<ComprasPage />);

    await screen.findByText("Cimento CP-II");
    await user.click(screen.getAllByRole("button", { name: "Precificar" })[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Informar preço")).toBeInTheDocument();
    expect(within(dialog).getByText(/Preço unitário/)).toBeInTheDocument();
  });
});