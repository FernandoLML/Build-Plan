// Caminho: /backend/src/controllers/material.controller.ts
// Entrada HTTP do catálogo de Materiais (M4). Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { materialService } from "../services/material.service.js";
import {
  createMaterialSchema,
  updateMaterialSchema,
  obraIdParamSchema,
  materialIdParamSchema,
} from "../schemas/material.schema.js";

export class MaterialController {
  // POST /api/obras/:obraId/materiais
  public async criar(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const data = createMaterialSchema.parse(req.body);
    const material = await materialService.criar(obraId, req.userId, data);
    return res.status(201).json(material);
  }

  // GET /api/obras/:obraId/materiais
  public async listar(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const materiais = await materialService.listarPorObra(obraId, req.userId);
    return res.status(200).json(materiais);
  }

  // GET /api/materiais/:id
  public async buscarPorId(req: Request, res: Response): Promise<Response> {
    const { id } = materialIdParamSchema.parse(req.params);
    const material = await materialService.buscarPorId(id, req.userId);
    return res.status(200).json(material);
  }

  // PUT /api/materiais/:id
  public async atualizar(req: Request, res: Response): Promise<Response> {
    const { id } = materialIdParamSchema.parse(req.params);
    const data = updateMaterialSchema.parse(req.body);
    const material = await materialService.atualizar(id, req.userId, data);
    return res.status(200).json(material);
  }

  // DELETE /api/materiais/:id
  public async remover(req: Request, res: Response): Promise<Response> {
    const { id } = materialIdParamSchema.parse(req.params);
    await materialService.remover(id, req.userId);
    return res.status(204).send();
  }
}

export const materialController = new MaterialController();