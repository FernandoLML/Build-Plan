// Caminho: /backend/src/routes/dashboard.routes.ts
// Rota do dashboard da obra (M5 — Workstream A), aninhada em /api/obras/:obraId/dashboard.
// mergeParams: true garante acesso ao :obraId da rota pai.
// Montado DENTRO de obra.routes.ts, que já aplica o authMiddleware.

import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const obraDashboardRoutes = Router({ mergeParams: true });

obraDashboardRoutes.get("/", asyncHandler((req, res) => dashboardController.obter(req, res)));

export { obraDashboardRoutes };