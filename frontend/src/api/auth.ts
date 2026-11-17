// Caminho: /frontend/src/api/auth.ts
// Chamadas HTTP de autenticação (camada de API pura, tipada).

import { api } from "@/lib/api";
import type {
  AtualizarPerfilPayload,
  AuthResponse,
  LoginPayload,
  MensagemResponse,
  RegisterPayload,
  Usuario,
} from "@/types/auth";

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

  // POST /api/auth/esqueci-senha
  async esqueciSenha(email: string): Promise<MensagemResponse> {
    const { data } = await api.post<MensagemResponse>("/auth/esqueci-senha", { email });
    return data;
  },

  // POST /api/auth/redefinir-senha
  async redefinirSenha(token: string, senha: string): Promise<MensagemResponse> {
    const { data } = await api.post<MensagemResponse>("/auth/redefinir-senha", { token, senha });
    return data;
  },

  // PUT /api/auth/me
  async atualizarPerfil(payload: AtualizarPerfilPayload): Promise<Usuario> {
    const { data } = await api.put<Usuario>("/auth/me", payload);
    return data;
  },

  // DELETE /api/auth/me (a senha vai no corpo, como confirmação)
  async excluirConta(senha: string): Promise<void> {
    await api.delete("/auth/me", { data: { senha } });
  },
};