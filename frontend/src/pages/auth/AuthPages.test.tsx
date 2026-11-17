// Caminho: /frontend/src/pages/auth/AuthPages.test.tsx
// Telas públicas de acesso: login, cadastro (com o aceite da Política de
// Privacidade exigido pela LGPD) e a própria política.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { AxiosError, type AxiosResponse } from "axios";

import { renderComProviders } from "@/test/utils";
import { tokenStorage } from "@/lib/token";
import type { AuthContextValue } from "@/auth/AuthContextDef";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { PrivacidadePage } from "./PrivacidadePage";

vi.mock("@/api/auth", () => ({ authApi: { register: vi.fn() } }));
vi.mock("@/auth/useAuth", () => ({ useAuth: vi.fn() }));
import { authApi } from "@/api/auth";
import { useAuth } from "@/auth/useAuth";

const usuario = { id: "u1", nome: "Ana Lima", email: "ana@buildplan.test", papel: "GESTOR" as const };

const auth: AuthContextValue = {
  usuario: null,
  loading: false,
  autenticado: false,
  login: vi.fn(),
  logout: vi.fn(),
  setUsuario: vi.fn(),
};

function erroDaApi(status: number, message: string): AxiosError {
  const resposta = { status, data: { message } } as AxiosResponse;
  return new AxiosError(message, "ERR_BAD_REQUEST", undefined, undefined, resposta);
}

/** Renderiza a página com uma rota de destino para conferir a navegação. */
function renderPagina(pagina: React.ReactElement, rota: string) {
  return renderComProviders(
    <Routes>
      <Route path={rota} element={pagina} />
      <Route path="/dashboard" element={<div>painel da obra</div>} />
    </Routes>,
    { rota },
  );
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue(auth);
});

describe("LoginPage", () => {
  it("entra e vai para o dashboard", async () => {
    vi.mocked(auth.login).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPagina(<LoginPage />, "/login");

    await user.type(screen.getByLabelText("E-mail"), usuario.email);
    await user.type(screen.getByLabelText("Senha"), "senhaForte123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("painel da obra")).toBeInTheDocument();
    expect(auth.login).toHaveBeenCalledWith({ email: usuario.email, senha: "senhaForte123" });
  });

  it("mostra a mensagem da API quando as credenciais são recusadas", async () => {
    vi.mocked(auth.login).mockRejectedValue(erroDaApi(401, "Credenciais inválidas."));
    const user = userEvent.setup();
    renderPagina(<LoginPage />, "/login");

    await user.type(screen.getByLabelText("E-mail"), usuario.email);
    await user.type(screen.getByLabelText("Senha"), "senha-errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciais inválidas.");
  });

  it("oferece a recuperação de senha e o cadastro", () => {
    renderPagina(<LoginPage />, "/login");

    expect(screen.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute(
      "href",
      "/esqueci-senha",
    );
    expect(screen.getByRole("link", { name: "Cadastre-se" })).toHaveAttribute("href", "/register");
  });
});

describe("RegisterPage", () => {
  async function preencher(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Nome"), usuario.nome);
    await user.type(screen.getByLabelText("E-mail"), usuario.email);
    await user.type(screen.getByLabelText("Senha"), "senhaForte123");
  }

  it("não cadastra sem o aceite da Política de Privacidade", async () => {
    const user = userEvent.setup();
    renderPagina(<RegisterPage />, "/register");

    await preencher(user);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(
      await screen.findByText("É necessário aceitar a Política de Privacidade."),
    ).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("cadastra com o aceite, guarda a sessão e vai para o dashboard", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ token: "jwt-novo", usuario });
    const user = userEvent.setup();
    renderPagina(<RegisterPage />, "/register");

    await preencher(user);
    await user.click(screen.getByRole("checkbox", { name: /li e aceito/i }));
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("painel da obra")).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledWith({
      nome: usuario.nome,
      email: usuario.email,
      senha: "senhaForte123",
      aceitePrivacidade: true,
    });
    expect(tokenStorage.get()).toBe("jwt-novo");
    expect(auth.setUsuario).toHaveBeenCalledWith(usuario);
  });

  it("mostra o erro da API (e-mail já cadastrado) e não cria sessão", async () => {
    vi.mocked(authApi.register).mockRejectedValue(erroDaApi(409, "E-mail já cadastrado."));
    const user = userEvent.setup();
    renderPagina(<RegisterPage />, "/register");

    await preencher(user);
    await user.click(screen.getByRole("checkbox", { name: /li e aceito/i }));
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail já cadastrado.");
    expect(tokenStorage.get()).toBeNull();
  });

  it("leva à Política de Privacidade a partir do aceite", () => {
    renderPagina(<RegisterPage />, "/register");

    expect(screen.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
      "href",
      "/privacidade",
    );
  });
});

describe("PrivacidadePage", () => {
  it("lista os dados coletados, os direitos do titular e a retenção", () => {
    renderComProviders(<PrivacidadePage />);

    expect(screen.getByRole("heading", { name: "Política de Privacidade" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dados coletados" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seus direitos" })).toBeInTheDocument();
    expect(screen.getByText(/apenas o hash/i)).toBeInTheDocument();
    expect(screen.getByText(/excluir a conta em minha conta/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar para o cadastro" })).toHaveAttribute(
      "href",
      "/register",
    );
  });
});
