// Caminho: /backend/src/routes/vinculo.routes.ts
// Rotas de Vínculo Material-Etapa (M4). Duas exportações:
//  - etapaMaterialRoutes: aninhadas em /api/etapas/:etapaId/materiais (mergeParams).
//  - vinculoRoutes: recursos individuais em /api/vinculos/:id.

import { Router } from "express";
import { vinculoMaterialController } from "../controllers/vinculo-material.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

// mergeParams: true garante acesso ao :etapaId da rota pai.
// Montado DENTRO de etapa.routes.ts, que já aplica o authMiddleware.
const etapaMaterialRoutes = Router({ mergeParams: true });

etapaMaterialRoutes.get("/", asyncHandler((req, res) => vinculoMaterialController.listarPorEtapa(req, res)));
etapaMaterialRoutes.post("/", asyncHandler((req, res) => vinculoMaterialController.criar(req, res)));

// Recursos individuais de vínculo — protegidos pelo authMiddleware.
const vinculoRoutes = Router();
vinculoRoutes.use(authMiddleware);

vinculoRoutes.patch("/:id/status", asyncHandler((req, res) => vinculoMaterialController.atualizarStatus(req, res)));
vinculoRoutes.delete("/:id", asyncHandler((req, res) => vinculoMaterialController.remover(req, res)));

export { etapaMaterialRoutes, vinculoRoutes };