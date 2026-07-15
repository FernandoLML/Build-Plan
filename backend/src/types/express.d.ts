// Caminho: /backend/src/types/express.d.ts
// Augmenta o Request do Express com o id do usuário autenticado.
// Populado pelo authMiddleware (JWT) — Seção 6.1 do RFC.

import "express";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export {};