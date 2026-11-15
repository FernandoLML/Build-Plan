// Caminho: /frontend/src/components/obras/ObraFormDialog.test.tsx
// Testes do modal de Obra: validação, criação, edição e exibição do erro da API.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";

import { renderComProviders } from "@/test/utils";
import { ObraFormDialog } from "./ObraFormDialog";
import type { Obra } from "@/types/obra";

vi.mock("@/api/obras", () => ({
  obrasApi: {
    listar: vi.fn(),
    buscar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
  },
}));

import { obrasApi } from "@/api/obras";

const obra: Obra = {
  id: "obra-1",
  nome: "Residencial Aurora",
  descricao: "Prédio de 4 andares",
  endereco: "Rua A, 100",
  usuarioId: "u1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function erroDaApi(message?: string): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: message ? { message } : {},
  });
}

describe("ObraFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valida o nome mínimo antes de enviar", async () => {
    const user = userEvent.setup();
    renderComProviders(<ObraFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "ab");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("O nome deve ter ao menos 3 caracteres.")).toBeInTheDocument();
    expect(obrasApi.criar).not.toHaveBeenCalled();
  });

  it("cria uma obra e fecha o modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    vi.mocked(obrasApi.criar).mockResolvedValue(obra);
    renderComProviders(<ObraFormDialog open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("heading", { name: "Nova obra" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "Residencial Aurora");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(obrasApi.criar).toHaveBeenCalledWith(expect.objectContaining({ nome: "Residencial Aurora" }));
  });

  it("edita uma obra existente com os dados pré-preenchidos", async () => {
    const user = userEvent.setup();
    vi.mocked(obrasApi.atualizar).mockResolvedValue(obra);
    renderComProviders(<ObraFormDialog open onOpenChange={vi.fn()} obra={obra} />);

    expect(screen.getByRole("heading", { name: "Editar obra" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Residencial Aurora");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(obrasApi.atualizar).toHaveBeenCalledWith("obra-1", expect.objectContaining({ nome: "Residencial Aurora" })),
    );
  });

  it("exibe a mensagem de erro retornada pela API", async () => {
    const user = userEvent.setup();
    vi.mocked(obrasApi.criar).mockRejectedValue(erroDaApi("Já existe uma obra com esse nome."));
    renderComProviders(<ObraFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "Residencial Aurora");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Já existe uma obra com esse nome.")).toBeInTheDocument();
  });

  it("usa a mensagem genérica quando o erro não traz detalhes", async () => {
    const user = userEvent.setup();
    vi.mocked(obrasApi.criar).mockRejectedValue(new Error("falha de rede"));
    renderComProviders(<ObraFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Nome"), "Residencial Aurora");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Erro ao salvar a obra.")).toBeInTheDocument();
  });

  it("cancelar fecha o modal", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderComProviders(<ObraFormDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
