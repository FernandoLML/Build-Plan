// Caminho: /backend/src/routes/obra.routes.ts
// Definição das rotas REST de Obra. asyncHandler encaminha erros ao middleware.
// Todas as rotas são protegidas pelo authMiddleware (JWT).

import { Router } from "express";
import { obraController } from "../controllers/obra.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { obraEtapaRoutes } from "./etapa.routes.js";
import { obraMaterialRoutes } from "./material.routes.js";
import { obraListaRoutes } from "./lista-compras.routes.js";

const obraRoutes = Router();

// Protege TODAS as rotas de obra — popula req.userId a partir do token.
obraRoutes.use(authMiddleware);

obraRoutes.get("/", asyncHandler((req, res) => obraController.listar(req, res)));
obraRoutes.get("/:id", asyncHandler((req, res) => obraController.buscarPorId(req, res)));
obraRoutes.post("/", asyncHandler((req, res) => obraController.criar(req, res)));
obraRoutes.put("/:id", asyncHandler((req, res) => obraController.atualizar(req, res)));
obraRoutes.delete("/:id", asyncHandler((req, res) => obraController.remover(req, res)));

// Etapas aninhadas: /api/obras/:obraId/etapas (herda o authMiddleware acima).
obraRoutes.use("/:obraId/etapas", obraEtapaRoutes);

// Materiais aninhados: /api/obras/:obraId/materiais (herda o authMiddleware acima).
obraRoutes.use("/:obraId/materiais", obraMaterialRoutes);

// Listas de compras aninhadas: /api/obras/:obraId/listas-compras (herda o authMiddleware).
obraRoutes.use("/:obraId/listas-compras", obraListaRoutes);

export { obraRoutes };