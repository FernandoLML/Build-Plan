// Caminho: /frontend/src/lib/token.ts
// Armazenamento do JWT. Decisão homologada: localStorage (boa UX; trade-off de
// XSS documentado — evolução futura seria cookie httpOnly + refresh token).

const TOKEN_KEY = "buildplan.token";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
};