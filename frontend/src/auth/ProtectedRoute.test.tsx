// Caminho: /frontend/src/auth/ProtectedRoute.test.tsx
// Testes do ProtectedRoute: redireciona para /login sem sessão e renderiza o
// Outlet quando autenticado. O useAuth é mockado para controlar o estado.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import type { AuthContextValue } from "./AuthContext";

vi.mock("./useAuth", () => ({ useAuth: vi.fn() }));
import { useAuth } from "./useAuth";

// Monta um valor completo do contexto, sobrescrevendo apenas o necessário.
function mockarAuth(parcial: Partial<AuthContextValue>) {
  const valor: AuthContextValue = {
    usuario: null,
    loading: false,
    autenticado: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUsuario: vi.fn(),
    ...parcial,
  };
  vi.mocked(useAuth).mockReturnValue(valor);
}

function renderizarRota() {
  return render(
    <MemoryRouter initialEntries={["/privado"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/privado" element={<div>área restrita</div>} />
        </Route>
        <Route path="/login" element={<div>tela de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("redireciona para /login quando não autenticado", () => {
    mockarAuth({ autenticado: false, loading: false });

    renderizarRota();

    expect(screen.getByText("tela de login")).toBeInTheDocument();
    expect(screen.queryByText("área restrita")).not.toBeInTheDocument();
  });

  it("renderiza o conteúdo protegido (Outlet) quando autenticado", () => {
    mockarAuth({ autenticado: true, loading: false, usuario: null });

    renderizarRota();

    expect(screen.getByText("área restrita")).toBeInTheDocument();
    expect(screen.queryByText("tela de login")).not.toBeInTheDocument();
  });

  it("exibe o estado de carregamento enquanto a sessão é restaurada", () => {
    mockarAuth({ autenticado: false, loading: true });

    renderizarRota();

    expect(screen.getByText(/Carregando sessão/i)).toBeInTheDocument();
    expect(screen.queryByText("tela de login")).not.toBeInTheDocument();
  });
});