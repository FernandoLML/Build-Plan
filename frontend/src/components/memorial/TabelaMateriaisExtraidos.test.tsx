// Caminho: /frontend/src/components/memorial/TabelaMateriaisExtraidos.test.tsx
// Testes da tabela de conferência: renderização, seleção e itens duplicados.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TabelaMateriaisExtraidos } from "./TabelaMateriaisExtraidos";
import type { ItemMemorial } from "@/types/memorial";

const itens: ItemMemorial[] = [
  { nome: "Cimento", unidade: "sc", quantidade: 10, codigoSinapi: "00001379" },
  { nome: "Areia", especificacao: "Média lavada", unidade: "m3", quantidade: 5 },
  // Duplicado idêntico ao primeiro: precisa de key própria, sem warning do React.
  { nome: "Cimento", unidade: "sc", quantidade: 10, codigoSinapi: "00001379" },
];

describe("TabelaMateriaisExtraidos", () => {
  it("renderiza uma linha por item, inclusive duplicados, sem warning de key", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TabelaMateriaisExtraidos itens={itens} selecionados={[true, false, true]} onToggle={vi.fn()} />);

    expect(screen.getAllByRole("checkbox", { name: "Incluir Cimento" })).toHaveLength(2);
    expect(screen.getByText("Média lavada")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Incluir Areia" })).not.toBeChecked();
    expect(erro).not.toHaveBeenCalled();
    erro.mockRestore();
  });

  it("informa o índice da linha ao alternar a seleção", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TabelaMateriaisExtraidos itens={itens} selecionados={[]} onToggle={onToggle} />);

    await user.click(screen.getByRole("checkbox", { name: "Incluir Areia" }));

    expect(onToggle).toHaveBeenCalledWith(1);
  });
});
