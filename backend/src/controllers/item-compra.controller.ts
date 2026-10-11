// Caminho: /backend/src/controllers/item-compra.controller.ts
// Entrada HTTP dos Itens de Compra (M4 — Fase 2). Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { itemCompraService } from "../services/item-compra.service.js";
import {
  addItemSchema,
  updateItemSchema,
  listaIdParamSchema,
  itemIdParamSchema,
} from "../schemas/item-compra.schema.js";

export class ItemCompraController {
  // POST /api/listas-compras/:listaId/itens
  public async adicionar(req: Request, res: Response): Promise<Response> {
    const { listaId } = listaIdParamSchema.parse(req.params);
    const data = addItemSchema.parse(req.body);
    const item = await itemCompraService.adicionar(listaId, req.userId, data);
    return res.status(201).json(item);
  }

  // PATCH /api/itens-compra/:id  (fluxo "Informar" preço unitário)
  public async atualizar(req: Request, res: Response): Promise<Response> {
    const { id } = itemIdParamSchema.parse(req.params);
    const data = updateItemSchema.parse(req.body);
    const item = await itemCompraService.atualizar(id, req.userId, data);
    return res.status(200).json(item);
  }

  // DELETE /api/itens-compra/:id
  public async remover(req: Request, res: Response): Promise<Response> {
    const { id } = itemIdParamSchema.parse(req.params);
    await itemCompraService.remover(id, req.userId);
    return res.status(204).send();
  }
}

export const itemCompraController = new ItemCompraController();