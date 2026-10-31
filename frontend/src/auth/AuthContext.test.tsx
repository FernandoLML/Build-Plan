// Caminho: /frontend/src/auth/AuthContext.test.tsx
// Testes do AuthProvider: estado inicial sem sessão, persistência do token no
// login bem-sucedido e limpeza do estado no logout.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import { tokenStorage } from "@/lib/token";
import type { AuthResponse, Usuario } from "@/types/auth";

// Isola o AuthProvider da camada HTTP real.
vi.mock("@/api/auth", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}));

import { authApi } from "@/api/auth";

const usuarioFake: Usuario = {
  id: "usr-1",
  nome: "Ana Gestora",
  email: "ana@buildplan.dev",
  papel: "GESTOR",
};

const respostaLogin: AuthResponse = {
  usuario: usuarioFake,
  token: "jwt-token-fake",
};

// Componente sonda que expõe o contexto no DOM e aciona login/logout.
function Sonda() {
  const { usuario, loading, autenticado, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="autenticado">{String(autenticado)}</span>
      <span data-testid="usuario">{usuario?.nome ?? "nenhum"}</span>
      <button onClick={() => void login({ email: "ana@buildplan.dev", senha: "123456" })}>
        entrar
      </button>
      <button onClick={() => logout()}>sair</button>
    </div>
  );
}

function renderizar(children: ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("inicia sem usuário quando não há token no localStorage", async () => {
    renderizar(<Sonda />);

    // Após o efeito de montagem, o carregamento encerra sem sessão.
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    expect(screen.getByTestId("autenticado")).toHaveTextContent("false");
    expect(screen.getByTestId("usuario")).toHaveTextContent("nenhum");
    expect(authApi.me).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toBeNull();
  });

  it("persiste o token e atualiza o estado em um login bem-sucedido", async () => {
    vi.mocked(authApi.login).mockResolvedValue(respostaLogin);
    const user = userEvent.setup();

    renderizar(<Sonda />);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await user.click(screen.getByRole("button", { name: "entrar" }));

    await waitFor(() => expect(screen.getByTestId("usuario")).toHaveTextContent("Ana Gestora"));
    expect(screen.getByTestId("autenticado")).toHaveTextContent("true");
    expect(authApi.login).toHaveBeenCalledWith({
      email: "ana@buildplan.dev",
      senha: "123456",
    });
    expect(tokenStorage.get()).toBe("jwt-token-fake");
  });

  it("limpa o token e reseta o estado no logout", async () => {
    vi.mocked(authApi.login).mockResolvedValue(respostaLogin);
    const user = userEvent.setup();

    renderizar(<Sonda />);
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await user.click(screen.getByRole("button", { name: "entrar" }));
    await waitFor(() => expect(screen.getByTestId("autenticado")).toHaveTextContent("true"));

    await user.click(screen.getByRole("button", { name: "sair" }));

    await waitFor(() => expect(screen.getByTestId("autenticado")).toHaveTextContent("false"));
    expect(screen.getByTestId("usuario")).toHaveTextContent("nenhum");
    expect(tokenStorage.get()).toBeNull();
  });
});