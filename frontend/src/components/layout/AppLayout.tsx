// Caminho: /frontend/src/components/layout/AppLayout.tsx
// Shell das rotas autenticadas (Obsidian Precision): Sidebar fixa + canvas escuro.

import { Link, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useObras } from "@/hooks/useObras";

export function AppLayout() {
  const { obraAtivaId } = useObraAtiva();
  const { data: obras } = useObras();
  const obraAtiva = obras?.find((o) => o.id === obraAtivaId) ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      {/* Conteúdo deslocado pela sidebar fixa (w-72). */}
      <div className="pl-72">
        {/* Header superior sutil */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-8 backdrop-blur">
          <span className="text-sm font-medium text-slate-500">Painel operacional</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Obra:</span>
            <span className="max-w-[220px] truncate font-medium text-slate-200">
              {obraAtiva ? obraAtiva.nome : "nenhuma"}
            </span>
            <Link
              to="/obras"
              className="ml-2 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-100"
            >
              Trocar
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}