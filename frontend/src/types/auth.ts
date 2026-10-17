// Caminho: /frontend/src/types/auth.ts
// Tipos espelhando o contrato de autenticação do backend.

export type PapelUsuario = "GESTOR" | "PROPRIETARIO";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
}

export interface AuthResponse {
  usuario: Usuario;
  token: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}