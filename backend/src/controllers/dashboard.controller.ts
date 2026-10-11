// Caminho: /backend/src/controllers/dashboard.controller.ts
// Entrada HTTP do dashboard da obra (M5 — Workstream A).

import { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { obraIdParamSchema } from "../schemas/material.schema.js";

export class DashboardController {
  // GET /api/obras/:obraId/dashboard
  public async obter(req: Request, res: Response): Promise<Response> {
    const { obraId } = obraIdParamSchema.parse(req.params);
    const dashboard = await dashboardService.getDashboard(obraId, req.userId);
    return res.status(200).json(dashboard);
  }
}

export const dashboardController = new DashboardController();