// Caminho: /frontend/src/components/obras/ObraCard.test.tsx
// Testes do card de obra: estado ativo, progresso e callbacks das ações.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ObraCard } from "./ObraCard";
import type { Obra } from "@/types/obra";

const obra: Obra = {
  id: "obra-1",
  nome: "Residencial Aurora",
  descricao: "Prédio de 4 andares",
  endereco: "Rua A, 100",
  usuarioId: "u1",
  createdAt: "2026-01-01T12:00:00.000Z",
  updatedAt: "2026-01-01T12:00:00.000Z",
};

function renderCard(props: Partial<Parameters<typeof ObraCard>[0]> = {}) {
  const handlers = { onSelecionar: vi.fn(), onEditar: vi.fn(), onExcluir: vi.fn() };
  render(<ObraCard obra={obra} ativa={false} progresso={null} {...handlers} {...props} />);
  return handlers;
}

describe("ObraCard", () => {
  it("exibe os dados da obra e o aviso de progresso indisponível", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "Residencial Aurora" })).toBeInTheDocument();
    expect(screen.getByText("Rua A, 100")).toBeInTheDocument();
    expect(screen.getByText("Prédio de 4 andares")).toBeInTheDocument();
    expect(screen.getByText("Selecione a obra para ver o progresso.")).toBeInTheDocument();
  });

  it("obra ativa mostra o badge, o progresso e desabilita a seleção", () => {
    renderCard({ ativa: true, progresso: 100 });

    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecionada" })).toBeDisabled();
  });

  it("dispara os callbacks de selecionar, editar e excluir", async () => {
    const user = userEvent.setup();
    const { onSelecionar, onEditar, onExcluir } = renderCard({ progresso: 40 });

    await user.click(screen.getByRole("button", { name: "Selecionar" }));
    await user.click(screen.getByRole("button", { name: /Editar/ }));
    await user.click(screen.getByRole("button", { name: /Excluir/ }));

    expect(onSelecionar).toHaveBeenCalledWith(obra);
    expect(onEditar).toHaveBeenCalledWith(obra);
    expect(onExcluir).toHaveBeenCalledWith(obra);
  });
});
