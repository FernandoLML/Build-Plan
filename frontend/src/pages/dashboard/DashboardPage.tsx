// Caminho: /frontend/src/pages/dashboard/DashboardPage.tsx
// Rota privada de teste da fundação de auth. Será substituída pela Tela 2 real.

import { useAuth } from "@/auth/useAuth";

export function DashboardPage() {
  const { usuario, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={logout}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Sair
        </button>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-700">
          Sessão autenticada com sucesso. Bem-vindo(a),{" "}
          <strong>{usuario?.nome}</strong> ({usuario?.email}).
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Esta é uma rota protegida de teste — a Tela 2 (Dashboard operacional) será
          construída aqui, consumindo <code>GET /api/obras/:obraId/dashboard</code>.
        </p>
      </div>
    </div>
  );
}