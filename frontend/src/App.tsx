// Caminho: /frontend/src/App.tsx
// Rotas: públicas (/login, /register) e privadas (via ProtectedRoute).
// A Tela 1 (/obras) é a home pós-login.

import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ObrasPage } from "@/pages/obras/ObrasPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Privadas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Redirecionamentos — /obras é a home pós-login */}
      <Route path="/" element={<Navigate to="/obras" replace />} />
      <Route path="*" element={<Navigate to="/obras" replace />} />
    </Routes>
  );
}