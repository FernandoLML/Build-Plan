// Caminho: /frontend/src/auth/ProtectedRoute.tsx
// Protege rotas privadas: aguarda a restauração da sessão e, se não houver
// usuário autenticado, redireciona para /login. Usado como layout de rotas.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ProtectedRoute() {
  const { autenticado, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Carregando sessão…
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}