// Caminho: /backend/src/middlewares/error.middleware.ts
// Tratamento de erro centralizado. Traduz erros de validação (Zod) e de
// negócio (AppError) em respostas HTTP. Não expõe detalhes internos (Seção 6.1).

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  // Erro de validação de entrada
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Erro de validação.",
      issues: err.issues.map((i) => ({
        campo: i.path.join("."),
        mensagem: i.message,
      })),
    });
  }

  // Erro de negócio previsto
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Erro inesperado — loga internamente, responde genérico
  console.error("[erro-nao-tratado]", err);
  return res.status(500).json({ message: "Erro interno do servidor." });
}