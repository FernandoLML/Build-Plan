// Caminho: /frontend/src/auth/AuthContext.tsx
// Estado global de autenticação: usuário, carregamento, login/logout e
// restauração automática da sessão (GET /auth/me) na montagem da aplicação.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/lib/token";
import type { LoginPayload, Usuario } from "@/types/auth";
import { AuthContext, type AuthContextValue } from "./AuthContextDef";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(null);
  // Só há sessão a restaurar se existir token salvo; sem token, não carrega.
  const [loading, setLoading] = useState<boolean>(() => tokenStorage.get() !== null);

  // Restaura a sessão ao montar, se houver token salvo.
  useEffect(() => {
    if (!tokenStorage.get()) return;
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