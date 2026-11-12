// Caminho: /frontend/src/auth/AuthContextDef.ts
// Objeto do contexto de autenticação + contrato. Separado do AuthProvider para
// que AuthContext.tsx exporte apenas componentes (Fast Refresh /
// react-refresh/only-export-components).

import { createContext } from "react";
import type { LoginPayload, Usuario } from "@/types/auth";

export interface AuthContextValue {
  usuario: Usuario | null;
  loading: boolean; // true enquanto restaura a sessão inicial
  autenticado: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  setUsuario: (usuario: Usuario) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
