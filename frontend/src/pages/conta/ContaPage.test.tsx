// Caminho: /frontend/src/pages/conta/ContaPage.test.tsx
// Minha conta: edição dos dados pessoais e exclusão da conta (LGPD).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { AxiosError, type AxiosResponse } from "axios";

import { renderComProviders } from "@/test/utils";
import { queryClient } from "@/lib/queryClient";
import type { AuthContextValue } from "@/auth/AuthContextDef";
import { ContaPage } from "./ContaPage";

vi.mock("@/api/auth", () => ({
  authApi: { atualizarPerfil: vi.fn(), excluirConta: vi.fn() },
}));
vi.mock("@/auth/useAuth", () => ({ useAuth: vi.fn() }));
import { authApi } from "@/api/auth";
import { useAuth } from "@/auth/useAuth";

const usuario = { id: "u1", nome: "Ana Lima", email: "ana@buildplan.test", papel: "GESTOR" as const };

const auth: AuthContextValue = {
  usuario,
  loading: false,
  autenticado: true,
  login: vi.fn(),
  logout: vi.fn(),
  setUsuario: vi.fn(),
};

function erroDaApi(status: number, message: string): AxiosError {
  const resposta = { status, data: { message } } as AxiosResponse;
  return new AxiosError(message, "ERR_BAD_REQUEST", undefined, undefined, resposta);
}

function renderConta() {
  return renderComProviders(
    <Routes>
      <Route path="/conta" element={<ContaPage />} />
      <Route path="/login" element={<div>tela de login</div>} />
    </Routes>,
    { rota: "/conta" },
  );
}

const formPerfil = () => screen.getByRole("form", { name: "Dados pessoais" });
const formExclusao = () => screen.getByRole("form", { name: "Excluir conta" });

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue(auth);
});

describe("ContaPage — dados pessoais", () => {
  it("abre com os dados atuais do usuário", () => {
    renderConta();

    expect(within(formPerfil()).getByLabelText("Nome")).toHaveValue(usuario.nome);
    expect(within(formPerfil()).getByLabelText("E-mail")).toHaveValue(usuario.email);
  });

  it("salva as alterações e atualiza o usuário da sessão", async () => {
    const atualizado = { ...usuario, nome: "Ana Lima Souza" };
    vi.mocked(authApi.atualizarPerfil).mockResolvedValue(atualizado);
    const user = userEvent.setup();
    renderConta();

    const nome = within(formPerfil()).getByLabelText("Nome");
    await user.clear(nome);
    await user.type(nome, "Ana Lima Souza");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Dados atualizados.");
    expect(authApi.atualizarPerfil).toHaveBeenCalledWith({
      nome: "Ana Lima Souza",
      email: usuario.email,
    });
    expect(auth.setUsuario).toHaveBeenCalledWith(atualizado);
  });

  it("valida o nome antes de chamar a API", async () => {
    const user = userEvent.setup();
    renderConta();

    const nome = within(formPerfil()).getByLabelText("Nome");
    await user.clear(nome);
    await user.type(nome, "ab");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("O nome deve ter ao menos 3 caracteres.")).toBeInTheDocument();
    expect(authApi.atualizarPerfil).not.toHaveBeenCalled();
  });

  it("mostra o erro da API quando o e-mail já pertence a outra conta", async () => {
    vi.mocked(authApi.atualizarPerfil).mockRejectedValue(erroDaApi(409, "E-mail já cadastrado."));
    const user = userEvent.setup();
    renderConta();

    const email = within(formPerfil()).getByLabelText("E-mail");
    await user.clear(email);
    await user.type(email, "outro@buildplan.test");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await within(formPerfil()).findByRole("alert")).toHaveTextContent("E-mail já cadastrado.");
    expect(auth.setUsuario).not.toHaveBeenCalled();
  });
});

describe("ContaPage — excluir conta", () => {
  it("exige a senha para confirmar", async () => {
    const user = userEvent.setup();
    renderConta();

    await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));

    expect(await screen.findByText("Informe a senha para confirmar.")).toBeInTheDocument();
    expect(authApi.excluirConta).not.toHaveBeenCalled();
  });

  it("exclui, limpa a sessão e o cache e volta para o login", async () => {
    vi.mocked(authApi.excluirConta).mockResolvedValue(undefined);
    const limparCache = vi.spyOn(queryClient, "clear");
    const user = userEvent.setup();
    renderConta();

    await user.type(within(formExclusao()).getByLabelText("Confirme com a sua senha"), "senhaForte123");
    await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));

    expect(await screen.findByText("tela de login")).toBeInTheDocument();
    expect(authApi.excluirConta).toHaveBeenCalledWith("senhaForte123");
    expect(auth.logout).toHaveBeenCalled();
    expect(limparCache).toHaveBeenCalled();
  });

  it("com a senha errada, mantém a sessão e mostra o erro", async () => {
    vi.mocked(authApi.excluirConta).mockRejectedValue(erroDaApi(400, "Senha incorreta."));
    const user = userEvent.setup();
    renderConta();

    await user.type(within(formExclusao()).getByLabelText("Confirme com a sua senha"), "senha-errada");
    await user.click(screen.getByRole("button", { name: "Excluir minha conta" }));

    expect(await within(formExclusao()).findByRole("alert")).toHaveTextContent("Senha incorreta.");
    expect(auth.logout).not.toHaveBeenCalled();
    expect(screen.queryByText("tela de login")).not.toBeInTheDocument();
  });
});
