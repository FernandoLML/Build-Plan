// Caminho: /backend/src/routes/obra.routes.ts
// Definição das rotas REST de Obra. asyncHandler encaminha erros ao middleware.

import { Router } from "express";
import { obraController } from "../controllers/obra.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
// import { authMiddleware } from "../middlewares/auth.middleware.js"; // habilitar quando o M2/auth estiver pronto

const obraRoutes = Router();

// Quando o middleware de autenticação estiver implementado, proteja todas as rotas:
// obraRoutes.use(authMiddleware);

obraRoutes.get("/", asyncHandler((req, res) => obraController.listar(req, res)));
obraRoutes.get("/:id", asyncHandler((req, res) => obraController.buscarPorId(req, res)));
obraRoutes.post("/", asyncHandler((req, res) => obraController.criar(req, res)));
obraRoutes.put("/:id", asyncHandler((req, res) => obraController.atualizar(req, res)));
obraRoutes.delete("/:id", asyncHandler((req, res) => obraController.remover(req, res)));

export { obraRoutes };