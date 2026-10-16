// Caminho: /backend/src/controllers/export.controller.ts
// Entrada HTTP da exportação de relatórios (M5 — Workstream B).

import { Request, Response } from "express";
import { exportService } from "../services/export.service.js";
import { listaIdParamSchema } from "../schemas/lista-compras.schema.js";

export class ExportController {
  // GET /api/listas-compras/:id/export.csv
  public async listaComprasCsv(req: Request, res: Response): Promise<Response> {
    const { id } = listaIdParamSchema.parse(req.params);
    const csv = await exportService.exportarListaComprasCsv(id, req.userId);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="lista-compras-${id}.csv"`);
    return res.status(200).send(csv);
  }
}

export const exportController = new ExportController();