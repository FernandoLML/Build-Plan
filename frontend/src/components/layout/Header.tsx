// Caminho: /frontend/src/components/layout/Header.tsx
// Header fixo: logo, obra ativa + "Trocar obra", navegação, usuário e logout.

import { Link, NavLink } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/useAuth";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useObras } from "@/hooks/useObras";

const linkBase = "text-sm font-medium transition-colors hover:text-slate-900";

export function Header() {
  const { usuario, logout } = useAuth();
  const { obraAtivaId } = useObraAtiva();
  const { data: obras } = useObras();

  const obraAtiva = obras?.find((o) => o.id === obraAtivaId) ?? null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        {/* Logo + navegação */}
        <div className="flex items-center gap-6">
          <Link to="/obras" className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Build-Plan
          </Link>
          <nav className="flex items-center gap-4">
            <NavLink
              to="/obras"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "text-slate-900" : "text-slate-500"}`
              }
            >
              Obras
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "text-slate-900" : "text-slate-500"}`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>

        {/* Obra ativa + usuário */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-slate-400">Obra ativa:</span>
            <span className="max-w-[160px] truncate text-sm font-medium">
              {obraAtiva ? obraAtiva.nome : "nenhuma"}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link to="/obras">Trocar obra</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-600 md:inline">{usuario?.nome}</span>
            <Button size="sm" variant="ghost" onClick={logout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}