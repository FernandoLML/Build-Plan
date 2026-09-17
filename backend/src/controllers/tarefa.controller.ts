// Caminho: /backend/src/controllers/tarefa.controller.ts
// Entrada HTTP de Tarefas. Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { tarefaService } from "../services/tarefa.service.js";
import {
  createTarefaSchema,
  updateTarefaSchema,
  tarefaIdParamSchema,
} from "../schemas/tarefa.schema.js";
import { etapaIdParamSchema } from "../schemas/etapa.schema.js";

export class TarefaController {
  // POST /api/etapas/:etapaId/tarefas
  public async criar(req: Request, res: Response): Promise<Response> {
    const { etapaId } = etapaIdParamSchema.parse(req.params);
    const data = createTarefaSchema.parse(req.body);
    const tarefa = await tarefaService.criar(etapaId, req.userId, data);
    return res.status(201).json(tarefa);
  }

  // GET /api/etapas/:etapaId/tarefas
  public async listarPorEtapa(req: Request, res: Response): Promise<Response> {
    const { etapaId } = etapaIdParamSchema.parse(req.params);
    const tarefas = await tarefaService.listarPorEtapa(etapaId, req.userId);
    return res.status(200).json(tarefas);
  }

  // GET /api/tarefas/:id
  public async buscarPorId(req: Request, res: Response): Promise<Response> {
    const { id } = tarefaIdParamSchema.parse(req.params);
    const tarefa = await tarefaService.buscarPorId(id, req.userId);
    return res.status(200).json(tarefa);
  }

  // PUT /api/tarefas/:id
  public async atualizar(req: Request, res: Response): Promise<Response> {
    const { id } = tarefaIdParamSchema.parse(req.params);
    const data = updateTarefaSchema.parse(req.body);
    const tarefa = await tarefaService.atualizar(id, req.userId, data);
    return res.status(200).json(tarefa);
  }

  // DELETE /api/tarefas/:id
  public async remover(req: Request, res: Response): Promise<Response> {
    const { id } = tarefaIdParamSchema.parse(req.params);
    await tarefaService.remover(id, req.userId);
    return res.status(204).send();
  }
}

export const tarefaController = new TarefaController();