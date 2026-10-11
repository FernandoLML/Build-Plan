// Caminho: /backend/src/routes/memorial.routes.ts
// Rotas do UC01 (M4 Fase 3), aninhadas em /api/obras/:obraId/materiais.
// mergeParams: true garante acesso ao :obraId da rota pai.
// Montado DENTRO de obra.routes.ts, que já aplica o authMiddleware.

import { Router } from "express";
import { memorialController } from "../controllers/memorial.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const obraMemorialRoutes = Router({ mergeParams: true });

// Pré-visualização para revisão (não persiste).
obraMemorialRoutes.post(
  "/preview-memorial",
  asyncHandler((req, res) => memorialController.preview(req, res)),
);

// Importação em lote (persiste os materiais com origem MEMORIAL).
obraMemorialRoutes.post(
  "/importar-memorial",
  asyncHandler((req, res) => memorialController.importar(req, res)),
);

export { obraMemorialRoutes };