// Caminho: /backend/src/middlewares/async-handler.ts
// Envolve handlers assíncronos e encaminha qualquer erro ao middleware de erro,
// evitando try/catch repetido em cada controller.

import { Request, Response, NextFunction, RequestHandler } from "express";
import { marcarRota } from "../lib/metricas.js";

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    // Registra o padrão da rota para as métricas antes de o handler rodar.
    marcarRota(req, res);
    Promise.resolve(fn(req, res, next)).catch(next);
  };