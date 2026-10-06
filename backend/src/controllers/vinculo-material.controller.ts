// Caminho: /backend/src/controllers/vinculo-material.controller.ts
// Entrada HTTP dos Vínculos Material-Etapa (M4). Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { vinculoMaterialService } from "../services/vinculo-material.service.js";
import {
  createVinculoSchema,
  updateStatusVinculoSchema,
  vinculoIdParamSchema,
} from "../schemas/vinculo.schema.js";
import { etapaIdParamSchema } from "../schemas/etapa.schema.js";

export class VinculoMaterialController {
  // POST /api/etapas/:etapaId/materiais
  // O etapaId vem da rota; materialId/quantidade/local vêm do corpo.
  public async criar(req: Request, res: Response): Promise<Response> {
    const { etapaId } = etapaIdParamSchema.parse(req.params);
    const data = createVinculoSchema.parse({ ...req.body, etapaId });
    const vinculo = await vinculoMaterialService.criar(req.userId, data);
    return res.status(201).json(vinculo);
  }

  // GET /api/etapas/:etapaId/materiais
  public async listarPorEtapa(req: Request, res: Response): Promise<Response> {
    const { etapaId } = etapaIdParamSchema.parse(req.params);
    const vinculos = await vinculoMaterialService.listarPorEtapa(etapaId, req.userId);
    return res.status(200).json(vinculos);
  }

  // PATCH /api/vinculos/:id/status
  public async atualizarStatus(req: Request, res: Response): Promise<Response> {
    const { id } = vinculoIdParamSchema.parse(req.params);
    const { status, detalhes } = updateStatusVinculoSchema.parse(req.body);
    const vinculo = await vinculoMaterialService.atualizarStatus(
      id,
      req.userId,
      status,
      detalhes,
    );
    return res.status(200).json(vinculo);
  }

  // DELETE /api/vinculos/:id
  public async remover(req: Request, res: Response): Promise<Response> {
    const { id } = vinculoIdParamSchema.parse(req.params);
    await vinculoMaterialService.remover(id, req.userId);
    return res.status(204).send();
  }
}

export const vinculoMaterialController = new VinculoMaterialController();