// Caminho: /frontend/src/auth/AuthContext.tsx
// Estado global de autenticação: usuário, carregamento, login/logout e
// restauração automática da sessão (GET /auth/me) na montagem da aplicação.

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/lib/token";
import type { LoginPayload, Usuario } from "@/types/auth";

export interface AuthContextValue {
  usuario: Usuario | null;
  loading: boolean; // true enquanto restaura a sessão inicial
  autenticado: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  setUsuario: (usuario: Usuario) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restaura a sessão ao montar, se houver token salvo.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUsuarioState(u))
      .catch(() => {
        // Token inválido/expirado: encerra a sessão silenciosamente.
        tokenStorage.clear();
        setUsuarioState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token, usuario: u } = await authApi.login(payload);
    tokenStorage.set(token);
    setUsuarioState(u);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuarioState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      loading,
      autenticado: usuario !== null,
      login,
      logout,
      setUsuario: setUsuarioState,
    }),
    [usuario, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}