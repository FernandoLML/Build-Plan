// Caminho: /backend/src/routes/obra.routes.ts
// Definição das rotas REST de Obra. asyncHandler encaminha erros ao middleware.
// Todas as rotas são protegidas pelo authMiddleware (JWT).

import { Router } from "express";
import { obraController } from "../controllers/obra.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const obraRoutes = Router();

// Protege TODAS as rotas de obra — popula req.userId a partir do token.
obraRoutes.use(authMiddleware);

obraRoutes.get("/", asyncHandler((req, res) => obraController.listar(req, res)));
obraRoutes.get("/:id", asyncHandler((req, res) => obraController.buscarPorId(req, res)));
obraRoutes.post("/", asyncHandler((req, res) => obraController.criar(req, res)));
obraRoutes.put("/:id", asyncHandler((req, res) => obraController.atualizar(req, res)));
obraRoutes.delete("/:id", asyncHandler((req, res) => obraController.remover(req, res)));

export { obraRoutes };