// Caminho: /backend/src/controllers/etapa.controller.ts
// Entrada HTTP de Etapas. Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { etapaService } from "../services/etapa.service.js";
import {
  createEtapaSchema,
  updateEtapaSchema,
  obraIdParamSchema,
  etapaIdParamSchema,
} from "../schemas/etapa.schema.js";

export class EtapaController {
  // POST /api/obras/:obraId/etapas
  public async criar(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const data = createEtapaSchema.parse(req.body);
    const etapa = await etapaService.criar(obraId, req.userId, data);
    return res.status(201).json(etapa);
  }

  // GET /api/obras/:obraId/etapas
  public async listar(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const etapas = await etapaService.listarPorObra(obraId, req.userId);
    return res.status(200).json(etapas);
  }

  // PUT /api/etapas/:etapaId
  public async atualizar(req: Request, res: Response): Promise<Response> {
    const { etapaId } = etapaIdParamSchema.parse(req.params);
    const data = updateEtapaSchema.parse(req.body);
    const etapa = await etapaService.atualizar(etapaId, req.userId, data);
    return res.status(200).json(etapa);
  }

  // DELETE /api/etapas/:etapaId
  public async remover(req: Request, res: Response): Promise<Response> {
    const { etapaId } = etapaIdParamSchema.parse(req.params);
    await etapaService.remover(etapaId, req.userId);
    return res.status(204).send();
  }
}

export const etapaController = new EtapaController();