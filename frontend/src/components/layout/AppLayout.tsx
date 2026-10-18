// Caminho: /frontend/src/components/layout/AppLayout.tsx
// Shell das rotas autenticadas: Header fixo + área de conteúdo com <Outlet/>.

import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}