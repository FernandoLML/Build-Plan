// Caminho: /frontend/src/components/materiais/MaterialDetailPanel.test.tsx
// Testes do painel de detalhes do material: vazio, carregando, sem vínculos e lista.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MaterialDetailPanel, type VinculoResumo } from "./MaterialDetailPanel";
import type { Material } from "@/types/material";

const material: Material = {
  id: "m1",
  nome: "Cimento CP-II",
  especificacao: null,
  unidade: "sc",
  quantidade: "10",
  origem: "MEMORIAL",
  codigoSinapi: "00001379",
  obraId: "obra-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function renderPainel(props: Partial<Parameters<typeof MaterialDetailPanel>[0]> = {}) {
  const handlers = { onVincular: vi.fn(), onEditar: vi.fn(), onExcluir: vi.fn() };
  render(<MaterialDetailPanel material={material} vinculos={[]} {...handlers} {...props} />);
  return handlers;
}

describe("MaterialDetailPanel", () => {
  it("sem material selecionado mostra o estado vazio", () => {
    renderPainel({ material: null });

    expect(screen.getByText("Selecione um material para ver os detalhes.")).toBeInTheDocument();
  });

  it("mostra os detalhes do material", () => {
    renderPainel();

    expect(screen.getByRole("heading", { name: "Cimento CP-II" })).toBeInTheDocument();
    expect(screen.getByText("SINAPI 00001379")).toBeInTheDocument();
    expect(screen.getByText("Origem: Memorial")).toBeInTheDocument();
    expect(screen.getByText("Sem especificação técnica.")).toBeInTheDocument();
  });

  it("indica o carregamento dos vínculos", () => {
    renderPainel({ carregandoVinculos: true });

    expect(screen.getByText("Carregando vínculos…")).toBeInTheDocument();
  });

  it("indica quando o material não tem vínculos", () => {
    renderPainel();

    expect(screen.getByText("Este material ainda não está vinculado a etapas.")).toBeInTheDocument();
  });

  it("lista as etapas vinculadas", () => {
    const vinculos: VinculoResumo[] = [
      { id: "v1", etapaNome: "Fundação", quantidade: "4" },
      { id: "v2", etapaNome: "Alvenaria", quantidade: "6" },
    ];
    renderPainel({ vinculos });

    expect(screen.getByText("Fundação")).toBeInTheDocument();
    expect(screen.getByText("Alvenaria")).toBeInTheDocument();
    expect(screen.queryByText("Este material ainda não está vinculado a etapas.")).not.toBeInTheDocument();
  });

  it("dispara as ações com o material selecionado", async () => {
    const user = userEvent.setup();
    const { onVincular, onEditar, onExcluir } = renderPainel();

    for (const nome of [/Vincular/, /Editar/, /Excluir/]) {
      await user.click(screen.getByRole("button", { name: nome }));
    }

    expect(onVincular).toHaveBeenCalledWith(material);
    expect(onEditar).toHaveBeenCalledWith(material);
    expect(onExcluir).toHaveBeenCalledWith(material);
  });

  it("mostra quanto do material já está vinculado e quanto está livre", () => {
    renderPainel({ saldo: { total: 10, vinculado: 7.5, disponivel: 2.5 } });

    expect(screen.getByTestId("saldo-detalhe")).toHaveTextContent(
      "Vinculado às etapas: 7,5 sc · disponível: 2,5 sc",
    );
  });

  it("não mostra o saldo enquanto os vínculos carregam", () => {
    renderPainel({ saldo: { total: 10, vinculado: 0, disponivel: 10 }, carregandoVinculos: true });

    expect(screen.queryByTestId("saldo-detalhe")).not.toBeInTheDocument();
  });
});
