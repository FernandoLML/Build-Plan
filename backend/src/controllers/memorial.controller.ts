// Caminho: /backend/src/controllers/memorial.controller.ts
// Entrada HTTP do UC01 (M4 Fase 3). Aceita CSV como raw text (text/csv) ou
// payload JSON ({ csv } ou { itens }). Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { memorialService } from "../services/memorial.service.js";
import { previewMemorialSchema, importMemorialSchema } from "../schemas/memorial.schema.js";
import { obraIdParamSchema } from "../schemas/material.schema.js";

export class MemorialController {
  // POST /api/obras/:obraId/materiais/preview-memorial
  public async preview(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);

    // Corpo pode chegar como texto cru (text/csv) ou como JSON.
    const input =
      typeof req.body === "string"
        ? { csv: req.body }
        : previewMemorialSchema.parse(req.body);

    const resultado = await memorialService.preview(obraId, req.userId, input);
    return res.status(200).json(resultado);
  }

  // POST /api/obras/:obraId/materiais/importar-memorial
  public async importar(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const { itens } = importMemorialSchema.parse(req.body);
    const resultado = await memorialService.importarMemorial(obraId, req.userId, itens);
    return res.status(201).json(resultado);
  }
}

export const memorialController = new MemorialController();