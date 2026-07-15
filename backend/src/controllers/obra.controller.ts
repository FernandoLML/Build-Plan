// Caminho: /backend/src/controllers/obra.controller.ts
// Camada de entrada HTTP. Valida com Zod, delega ao service e formata a resposta.
// Não contém regra de negócio nem acesso direto ao Prisma.

import { Request, Response } from "express";
import { obraService } from "../services/obra.service.js";
import {
  createObraSchema,
  updateObraSchema,
  obraIdParamSchema,
} from "../schemas/obra.schema.js";

export class ObraController {
  public async listar(req: Request, res: Response): Promise<Response> {
    const obras = await obraService.listar(req.userId);
    return res.status(200).json(obras);
  }

  public async buscarPorId(req: Request, res: Response): Promise<Response> {
    const { id } = obraIdParamSchema.parse(req.params);
    const obra = await obraService.buscarPorId(id, req.userId);
    return res.status(200).json(obra);
  }

  public async criar(req: Request, res: Response): Promise<Response> {
    const data = createObraSchema.parse(req.body);
    const obra = await obraService.criar(req.userId, data);
    return res.status(201).json(obra);
  }

  public async atualizar(req: Request, res: Response): Promise<Response> {
    const { id } = obraIdParamSchema.parse(req.params);
    const data = updateObraSchema.parse(req.body);
    const obra = await obraService.atualizar(id, req.userId, data);
    return res.status(200).json(obra);
  }

  public async remover(req: Request, res: Response): Promise<Response> {
    const { id } = obraIdParamSchema.parse(req.params);
    await obraService.remover(id, req.userId);
    return res.status(204).send();
  }
}

export const obraController = new ObraController();