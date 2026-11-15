// Caminho: /backend/src/controllers/export.controller.ts
// Entrada HTTP da exportação de relatórios (M5 — Workstream B).

import { Request, Response } from "express";
import { exportService, type ArquivoExportado } from "../services/export.service.js";
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

  // GET /api/listas-compras/:id/export.xlsx
  public async listaComprasXlsx(req: Request, res: Response): Promise<Response> {
    const { id } = listaIdParamSchema.parse(req.params);
    const arquivo = await exportService.exportarListaComprasXlsx(id, req.userId);
    return enviarArquivo(res, arquivo, MIME_XLSX);
  }

  // GET /api/listas-compras/:id/export.pdf
  public async listaComprasPdf(req: Request, res: Response): Promise<Response> {
    const { id } = listaIdParamSchema.parse(req.params);
    const arquivo = await exportService.exportarListaComprasPdf(id, req.userId);
    return enviarArquivo(res, arquivo, "application/pdf");
  }
}

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function enviarArquivo(res: Response, arquivo: ArquivoExportado, mime: string): Response {
  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Disposition", `attachment; filename="${arquivo.nomeArquivo}"`);
  res.setHeader("Content-Length", String(arquivo.conteudo.length));
  return res.status(200).send(arquivo.conteudo);
}

export const exportController = new ExportController();