// Caminho: /frontend/src/pages/compras/ComprasPage.test.tsx
// Testes da Tela 5 — Lista de Compras: banner de itens sem cotação, exibição do
// total orçado (snapshot congelado no backend) e cobertura derivada no cliente,
// abertura do diálogo "Informar preço" e exportação (.xlsx / .pdf / .csv).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
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
    exportarXlsx: vi.fn(),
    exportarPdf: vi.fn(),
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

describe("ComprasPage — exportação", () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:lista");
  const revokeObjectURL = vi.fn();
  const urlOriginal = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  let cliques: HTMLAnchorElement[];

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    cliques = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      cliques.push(this);
    });
    vi.mocked(etapasApi.listar).mockResolvedValue([etapa]);
    vi.mocked(comprasApi.listarPorObra).mockResolvedValue([listaBase(1, itensComPendencia)]);
  });

  afterEach(() => {
    URL.createObjectURL = urlOriginal.create;
    URL.revokeObjectURL = urlOriginal.revoke;
    vi.restoreAllMocks();
  });

  async function renderizarEsperandoEtapa() {
    const user = userEvent.setup();
    renderComProviders(<ComprasPage />);
    await screen.findByText("Cimento CP-II");
    // O nome do arquivo usa o nome da etapa, que chega na query de etapas.
    await screen.findByRole("button", { name: "Fundação" });
    return user;
  }

  it("baixa a planilha .xlsx da lista com o nome da etapa", async () => {
    const planilha = new Blob(["xlsx"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    vi.mocked(comprasApi.exportarXlsx).mockResolvedValue(planilha);
    const user = await renderizarEsperandoEtapa();

    await user.click(screen.getByRole("button", { name: /Exportar Excel \(\.xlsx\)/ }));

    await waitFor(() => expect(cliques).toHaveLength(1));
    expect(comprasApi.exportarXlsx).toHaveBeenCalledWith("lista-1");
    expect(createObjectURL).toHaveBeenCalledWith(planilha);
    expect(cliques[0].download).toBe("lista-compras-fundacao.xlsx");
    expect(cliques[0].href).toBe("blob:lista");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:lista");
  });

  it("baixa o PDF da lista", async () => {
    vi.mocked(comprasApi.exportarPdf).mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
    const user = await renderizarEsperandoEtapa();

    await user.click(screen.getByRole("button", { name: /Exportar PDF/ }));

    await waitFor(() => expect(cliques).toHaveLength(1));
    expect(comprasApi.exportarPdf).toHaveBeenCalledWith("lista-1");
    expect(cliques[0].download).toBe("lista-compras-fundacao.pdf");
  });

  it("mantém a exportação CSV", async () => {
    vi.mocked(comprasApi.exportarCsv).mockResolvedValue("Descricao,Unidade");
    const user = await renderizarEsperandoEtapa();

    await user.click(screen.getByRole("button", { name: /Exportar CSV/ }));

    await waitFor(() => expect(cliques).toHaveLength(1));
    expect(comprasApi.exportarCsv).toHaveBeenCalledWith("lista-1");
    expect(cliques[0].download).toBe("lista-compras-fundacao.csv");
  });

  it("mostra 'Exportando…' e bloqueia os botões durante o download", async () => {
    let concluir: (blob: Blob) => void = () => {};
    vi.mocked(comprasApi.exportarXlsx).mockReturnValue(new Promise<Blob>((resolve) => (concluir = resolve)));
    const user = await renderizarEsperandoEtapa();

    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));

    expect(await screen.findByRole("button", { name: /Exportando/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Exportar PDF/ })).toBeDisabled();

    concluir(new Blob(["x"]));
    expect(await screen.findByRole("button", { name: /Exportar Excel/ })).toBeEnabled();
  });

  it("exibe erro quando a exportação falha, sem disparar download", async () => {
    vi.mocked(comprasApi.exportarXlsx).mockRejectedValue(new Error("500"));
    const user = await renderizarEsperandoEtapa();

    await user.click(screen.getByRole("button", { name: /Exportar Excel/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível exportar a lista.");
    expect(cliques).toHaveLength(0);
  });
});
