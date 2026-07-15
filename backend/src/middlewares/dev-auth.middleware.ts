// Caminho: /backend/src/middlewares/dev-auth.middleware.ts
// ⚠️ TEMPORÁRIO — apenas para testar o CRUD de Obras antes de o JWT estar pronto.
// Injeta um usuarioId fixo em req.userId. REMOVA quando o authMiddleware real
// (JWT + bcrypt, Seção 6.1) for implementado nesta mesma etapa do M2.

import { Request, Response, NextFunction } from "express";

export function devAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Aceita o header "x-dev-user-id" ou usa um valor padrão.
  // Esse usuário precisa existir na tabela `usuario` (crie um via seed/prisma studio).
  req.userId = (req.header("x-dev-user-id") ?? process.env.DEV_USER_ID) as string;
  next();
}