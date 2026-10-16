// Caminho: /backend/src/controllers/log.controller.ts
// Entrada HTTP do Log de Rastreabilidade (Tela 6). Valida params e delega ao service.

import { Request, Response } from "express";
import { logService } from "../services/log.service.js";
import { vinculoIdParamSchema } from "../schemas/vinculo.schema.js";
import { obraIdParamSchema } from "../schemas/material.schema.js";

export class LogController {
  // GET /api/vinculos/:id/logs
  public async porVinculo(req: Request, res: Response): Promise<Response> {
    const { id } = vinculoIdParamSchema.parse(req.params);
    const logs = await logService.listarPorVinculo(id, req.userId);
    return res.status(200).json(logs);
  }

  // GET /api/obras/:obraId/logs
  public async porObra(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const logs = await logService.listarPorObra(obraId, req.userId);
    return res.status(200).json(logs);
  }
}

export const logController = new LogController();