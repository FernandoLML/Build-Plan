// Caminho: /backend/src/middlewares/auth.middleware.ts
// Middleware oficial de autenticação (Seção 6.1 do RFC).
// Lê "Authorization: Bearer <TOKEN>", valida a assinatura JWT e injeta
// req.userId. Substitui o dev-auth.middleware temporário.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Token de autenticação ausente.", 401);
  }

  const token = header.slice(7).trim(); // remove "Bearer "

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });

    if (typeof payload === "string" || !payload.sub) {
      throw new AppError("Token inválido.", 401);
    }

    req.userId = payload.sub;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    // jwt.verify lança em token expirado, assinatura inválida, malformado etc.
    throw new AppError("Token inválido ou expirado.", 401);
  }
}