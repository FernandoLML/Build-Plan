// Caminho: /frontend/src/api/auth.ts
// Chamadas HTTP de autenticação (camada de API pura, tipada).

import { api } from "@/lib/api";
import type { AuthResponse, LoginPayload, RegisterPayload, Usuario } from "@/types/auth";

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async me(): Promise<Usuario> {
    const { data } = await api.get<Usuario>("/auth/me");
    return data;
  },
};