// Caminho: /backend/src/routes/material.routes.ts
// Rotas de Material (M4). Duas exportações:
//  - obraMaterialRoutes: aninhadas em /api/obras/:obraId/materiais (mergeParams).
//  - materialRoutes: recursos individuais em /api/materiais/:id.

import { Router } from "express";
import { materialController } from "../controllers/material.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

// mergeParams: true garante acesso ao :obraId da rota pai.
// Montado DENTRO de obra.routes.ts, que já aplica o authMiddleware.
const obraMaterialRoutes = Router({ mergeParams: true });

obraMaterialRoutes.get("/", asyncHandler((req, res) => materialController.listar(req, res)));
obraMaterialRoutes.post("/", asyncHandler((req, res) => materialController.criar(req, res)));

// Recursos individuais de material — protegidos pelo authMiddleware.
const materialRoutes = Router();
materialRoutes.use(authMiddleware);

materialRoutes.get("/:id", asyncHandler((req, res) => materialController.buscarPorId(req, res)));
materialRoutes.put("/:id", asyncHandler((req, res) => materialController.atualizar(req, res)));
materialRoutes.delete("/:id", asyncHandler((req, res) => materialController.remover(req, res)));

export { obraMaterialRoutes, materialRoutes };