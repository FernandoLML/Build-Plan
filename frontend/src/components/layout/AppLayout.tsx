// Caminho: /frontend/src/components/layout/AppLayout.tsx
// Shell das rotas autenticadas: Header fixo + área de conteúdo com <Outlet/>.

import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}