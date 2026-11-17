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
  /** Aceite da Política de Privacidade (LGPD): a API só cadastra com `true`. */
  aceitePrivacidade: true;
}

export interface AtualizarPerfilPayload {
  nome?: string;
  email?: string;
}

/** Resposta das rotas que só confirmam a operação. */
export interface MensagemResponse {
  message: string;
}