// Caminho: /backend/src/modules/sinapi/sinapi.controller.ts
// Controller da rota GET /api/sinapi. Valida a query (Zod) e delega ao service.
// Envolvido por asyncHandler na rota — erros (inclusive ZodError → 400) sobem
// ao middleware de erro central da aplicação.

import type { Request, Response } from "express";
import { buscarSinapiQuerySchema } from "./sinapi.schema.js";
import { buscarSinapi } from "./sinapi.service.js";

export async function getSinapi(req: Request, res: Response) {
  const params = buscarSinapiQuerySchema.parse(req.query);
  const itens = await buscarSinapi(params);
  res.json(itens);
}