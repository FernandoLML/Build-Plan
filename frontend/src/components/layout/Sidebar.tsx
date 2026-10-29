// Caminho: /frontend/src/components/layout/Sidebar.tsx
// Menu lateral fixo (Obsidian Precision): logo, obra ativa, navegação e perfil.

import { Link, NavLink } from "react-router-dom";
import {
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "@/auth/useAuth";
import { useObraAtiva } from "@/contexts/useObraAtiva";
import { useObras } from "@/hooks/useObras";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITENS: NavItem[] = [
  { to: "/obras", label: "Obras", icon: Building2 },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/materiais", label: "Materiais", icon: Package },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/rastreabilidade", label: "Rastreabilidade", icon: ClipboardList },
  { to: "/memorial", label: "Memorial", icon: FileText },
];

export function Sidebar() {
  const { usuario, logout } = useAuth();
  const { obraAtivaId } = useObraAtiva();
  const { data: obras } = useObras();
  const obraAtiva = obras?.find((o) => o.id === obraAtivaId) ?? null;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-800 bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Boxes className="h-6 w-6 text-indigo-500" />
        <span className="font-display text-lg font-semibold tracking-tight text-slate-100">
          Build-Plan
        </span>
      </div>

      {/* Obra ativa */}
      <div className="px-4 py-4">
        <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Obra ativa
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-100">
            {obraAtiva ? obraAtiva.nome : "Nenhuma selecionada"}
          </p>
          <Link
            to="/obras"
            className="mt-2 inline-block text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            Trocar obra →
          </Link>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITENS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Perfil / rodapé */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{usuario?.nome}</p>
            <p className="truncate text-xs text-slate-500">{usuario?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}