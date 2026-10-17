// Caminho: /frontend/src/lib/api.ts
// Cliente HTTP único (Axios) com interceptors de request (Bearer token) e
// response (tratamento de 401 — limpa sessão e redireciona para /login).

import axios, { AxiosError } from "axios";
import { tokenStorage } from "./token";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Rotas de autenticação não devem disparar o redirect de 401 (o erro é tratado
// pela própria tela de login/registro).
const ROTAS_AUTH = ["/auth/login", "/auth/register"];

// Request: injeta o Bearer token, se existir.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: em 401 fora das rotas de auth, encerra a sessão e vai para /login.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const ehRotaAuth = ROTAS_AUTH.some((rota) => url.includes(rota));

    if (status === 401 && !ehRotaAuth) {
      tokenStorage.clear();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);