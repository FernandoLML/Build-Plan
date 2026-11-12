// Caminho: /frontend/src/components/materiais/MaterialFormDialog.test.tsx
// Modal de material: criação (POST + invalidação de cache), validação,
// edição (especificação apagada → null) e erro da API.

import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";

import { renderComProviders } from "@/test/utils";
import { MaterialFormDialog } from "./MaterialFormDialog";
import type { Material } from "@/types/material";

vi.mock("@/api/materiais", () => ({
  materiaisApi: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
  etapasApi: { listar: vi.fn(), criar: vi.fn() },
  vinculosApi: { listarPorEtapa: vi.fn(), criar: vi.fn(), excluir: vi.fn() },
}));
import { materiaisApi } from "@/api/materiais";

const existente: Material = {
  id: "m1",
  nome: "Cimento CP-II",
  especificacao: "Saco 50 kg",
  unidade: "saco",
  quantidade: "10",
  origem: "MANUAL",
  codigoSinapi: null,
  obraId: "obra-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function abrir(material: Material | null = null) {
  const onOpenChange = vi.fn();
  const utils = renderComProviders(
    <MaterialFormDialog open onOpenChange={onOpenChange} material={material} obraId="obra-1" />,
  );
  return { onOpenChange, ...utils };
}

describe("MaterialFormDialog — criação", () => {
  it("cria o material via POST, invalida materiais/dashboard e fecha o modal", async () => {
    vi.mocked(materiaisApi.criar).mockResolvedValue({ ...existente, id: "novo" });
    const user = userEvent.setup();
    const { onOpenChange, client } = abrir();
    const invalidar = vi.spyOn(client, "invalidateQueries");

    expect(screen.getByText("Novo material")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "Areia média");
    await user.type(screen.getByLabelText("Unidade"), "m³");
    await user.clear(screen.getByLabelText("Quantidade"));
    await user.type(screen.getByLabelText("Quantidade"), "12.5");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(materiaisApi.criar).toHaveBeenCalledWith("obra-1", {
        nome: "Areia média",
        unidade: "m³",
        quantidade: 12.5,
        especificacao: undefined, // vazio na criação é omitido
      }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["materiais", "obra-1"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["dashboard", "obra-1"] });
  });

  it("valida nome e unidade antes de enviar", async () => {
    const user = userEvent.setup();
    abrir();

    await user.type(screen.getByLabelText("Nome"), "A");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("O nome deve ter ao menos 2 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("A unidade é obrigatória.")).toBeInTheDocument();
    expect(materiaisApi.criar).not.toHaveBeenCalled();
  });

  it("exibe a mensagem de erro da API e mantém o modal aberto", async () => {
    const erro = new AxiosError("bad", "404", undefined, undefined, {
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { message: "Obra não encontrada." },
    });
    vi.mocked(materiaisApi.criar).mockRejectedValue(erro);
    const user = userEvent.setup();
    const { onOpenChange } = abrir();

    await user.type(screen.getByLabelText("Nome"), "Brita");
    await user.type(screen.getByLabelText("Unidade"), "m³");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Obra não encontrada.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

describe("MaterialFormDialog — edição", () => {
  it("pré-preenche e envia especificação apagada como null", async () => {
    vi.mocked(materiaisApi.atualizar).mockResolvedValue({ ...existente, especificacao: null });
    const user = userEvent.setup();
    abrir(existente);

    expect(screen.getByText("Editar material")).toBeInTheDocument();
    expect(screen.getByLabelText("Especificação")).toHaveValue("Saco 50 kg");

    await user.clear(screen.getByLabelText("Especificação"));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(materiaisApi.atualizar).toHaveBeenCalledWith("m1", {
        nome: "Cimento CP-II",
        unidade: "saco",
        quantidade: 10,
        especificacao: null,
      }),
    );
    expect(materiaisApi.criar).not.toHaveBeenCalled();
  });
});
