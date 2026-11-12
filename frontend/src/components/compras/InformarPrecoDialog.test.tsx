// Caminho: /frontend/src/components/compras/InformarPrecoDialog.test.tsx
// Testes do modal "Informar preço" com busca SINAPI: render, busca com debounce,
// seleção de insumo preenchendo o preço e submissão com o valor numérico correto.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderComProviders } from "@/test/utils";
import { InformarPrecoDialog } from "./InformarPrecoDialog";
import type { ItemCompra } from "@/types/compras";
import type { ItemSinapi } from "@/types/sinapi";

// Camada de API mockada.
vi.mock("@/api/sinapi", () => ({ sinapiApi: { buscar: vi.fn() } }));
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

import { sinapiApi } from "@/api/sinapi";
import { comprasApi } from "@/api/compras";

const item: ItemCompra = {
  id: "item-1",
  listaComprasId: "lista-1",
  materialId: "m1",
  descricao: "Cimento CP-II",
  unidade: "sc",
  quantidade: "10",
  precoUnitario: null,
  precoTotal: null,
  origemPreco: "PENDENTE",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const sugestao: ItemSinapi = {
  id: "s1",
  codigo: "00001379",
  descricao: "CIMENTO PORTLAND CP II-32",
  unidade: "KG",
  precoMediano: "0.74",
  uf: "SC",
  mesReferencia: 8,
  anoReferencia: 2025,
  regime: "NAO_DESONERADO",
  tipo: "INSUMO",
};

function abrir() {
  const onOpenChange = vi.fn();
  renderComProviders(
    <InformarPrecoDialog open item={item} obraId="obra-1" onOpenChange={onOpenChange} />,
  );
  return { onOpenChange };
}

describe("InformarPrecoDialog", () => {
  beforeEach(() => {
    vi.mocked(sinapiApi.buscar).mockResolvedValue([sugestao]);
    vi.mocked(comprasApi.atualizarItem).mockResolvedValue({ ...item, precoUnitario: "0.74" });
  });

  it("renderiza o diálogo com o campo de busca e o input de preço", () => {
    abrir();
    expect(screen.getByText("Informar preço")).toBeInTheDocument();
    expect(screen.getByLabelText(/Referência SINAPI/)).toBeInTheDocument();
    expect(screen.getByLabelText("Preço unitário (R$)")).toBeInTheDocument();
  });

  it("dispara a busca (com debounce) ao digitar no campo SINAPI, com UF e regime", async () => {
    const user = userEvent.setup();
    abrir();

    await user.type(screen.getByLabelText(/Referência SINAPI/), "cimento");

    await waitFor(() => expect(sinapiApi.buscar).toHaveBeenCalled());
    expect(sinapiApi.buscar).toHaveBeenCalledWith(
      expect.objectContaining({ q: "cimento", uf: "SC", regime: "NAO_DESONERADO", limit: 8 }),
    );
    expect(await screen.findByText(/CIMENTO PORTLAND CP II-32/)).toBeInTheDocument();
  });

  it("preenche o preço unitário ao selecionar um insumo sugerido", async () => {
    const user = userEvent.setup();
    abrir();

    await user.type(screen.getByLabelText(/Referência SINAPI/), "cimento");
    const sugestaoBtn = await screen.findByRole("button", { name: /CIMENTO PORTLAND CP II-32/ });
    await user.click(sugestaoBtn);

    const precoInput = screen.getByLabelText("Preço unitário (R$)") as HTMLInputElement;
    await waitFor(() => expect(precoInput.value).toBe("0.74"));
  });

  it("submete enviando o preço unitário como número e fecha o diálogo", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = abrir();

    await user.type(screen.getByLabelText(/Referência SINAPI/), "cimento");
    await user.click(await screen.findByRole("button", { name: /CIMENTO PORTLAND CP II-32/ }));
    await user.click(screen.getByRole("button", { name: "Salvar preço" }));

    await waitFor(() =>
      expect(comprasApi.atualizarItem).toHaveBeenCalledWith("item-1", { precoUnitario: 0.74 }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("limpa a busca e o erro ao fechar pelo botão Cancelar", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = abrir();

    const busca = screen.getByLabelText(/Referência SINAPI/) as HTMLInputElement;
    await user.type(busca, "cim");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(busca.value).toBe("");
  });
});
