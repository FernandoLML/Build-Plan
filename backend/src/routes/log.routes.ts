// Caminho: /backend/src/routes/log.routes.ts
// Rota agregada de logs por obra (Tela 6), aninhada em /api/obras/:obraId/logs.
// mergeParams: true garante acesso ao :obraId da rota pai.
// Montado DENTRO de obra.routes.ts, que já aplica o authMiddleware.
// (A timeline por vínculo — /api/vinculos/:id/logs — fica em vinculo.routes.ts.)

import { Router } from "express";
import { logController } from "../controllers/log.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const obraLogRoutes = Router({ mergeParams: true });

obraLogRoutes.get("/", asyncHandler((req, res) => logController.porObra(req, res)));

export { obraLogRoutes };