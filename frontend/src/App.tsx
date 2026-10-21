// Caminho: /frontend/src/App.tsx
// Rotas: públicas (/login, /register) e privadas (ProtectedRoute + AppLayout).

import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ObrasPage } from "@/pages/obras/ObrasPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { MemorialPage } from "@/pages/memorial/MemorialPage";
import { MateriaisPage } from "@/pages/materiais/MateriaisPage";
import { ComprasPage } from "@/pages/compras/ComprasPage";
import { RastreabilidadePage } from "@/pages/rastreabilidade/RastreabilidadePage";

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Privadas: exigem sessão (ProtectedRoute) e usam o shell (AppLayout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/obras" element={<ObrasPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/materiais" element={<MateriaisPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/rastreabilidade" element={<RastreabilidadePage />} />
          <Route path="/memorial" element={<MemorialPage />} />
        </Route>
      </Route>

      {/* Redirecionamentos — /obras é a home pós-login */}
      <Route path="/" element={<Navigate to="/obras" replace />} />
      <Route path="*" element={<Navigate to="/obras" replace />} />
    </Routes>
  );
}