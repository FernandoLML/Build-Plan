// Caminho: /backend/src/controllers/lista-compras.controller.ts
// Entrada HTTP das Listas de Compras (M4 — Fase 2). Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { listaComprasService } from "../services/lista-compras.service.js";
import {
  gerarListaSchema,
  etapaIdParamSchema,
  obraIdParamSchema,
  listaIdParamSchema,
} from "../schemas/lista-compras.schema.js";

export class ListaComprasController {
  // POST /api/etapas/:etapaId/lista-compras
  public async gerar(req: Request, res: Response): Promise<Response> {
    const { etapaId } = etapaIdParamSchema.parse(req.params);
    gerarListaSchema.parse(req.body ?? {}); // valida corpo opcional
    const lista = await listaComprasService.gerarPorEtapa(etapaId, req.userId);
    return res.status(201).json(lista);
  }

  // GET /api/obras/:obraId/listas-compras
  public async listarPorObra(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const listas = await listaComprasService.listarPorObra(obraId, req.userId);
    return res.status(200).json(listas);
  }

  // GET /api/listas-compras/:id
  public async buscar(req: Request, res: Response): Promise<Response> {
    const { id } = listaIdParamSchema.parse(req.params);
    const lista = await listaComprasService.buscar(id, req.userId);
    return res.status(200).json(lista);
  }

  // DELETE /api/listas-compras/:id
  public async remover(req: Request, res: Response): Promise<Response> {
    const { id } = listaIdParamSchema.parse(req.params);
    await listaComprasService.remover(id, req.userId);
    return res.status(204).send();
  }
}

export const listaComprasController = new ListaComprasController();