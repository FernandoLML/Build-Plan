// Caminho: /backend/src/routes/tarefa.routes.ts
// Rotas de Tarefa (M3). Duas exportações:
//  - etapaTarefaRoutes: aninhadas em /api/etapas/:etapaId/tarefas (mergeParams).
//  - tarefaRoutes: recursos individuais em /api/tarefas/:id.

import { Router } from "express";
import { tarefaController } from "../controllers/tarefa.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

// mergeParams: true garante acesso ao :etapaId da rota pai.
const etapaTarefaRoutes = Router({ mergeParams: true });

etapaTarefaRoutes.get("/", asyncHandler((req, res) => tarefaController.listarPorEtapa(req, res)));
etapaTarefaRoutes.post("/", asyncHandler((req, res) => tarefaController.criar(req, res)));

// Recursos individuais de tarefa — protegidos pelo authMiddleware.
const tarefaRoutes = Router();
tarefaRoutes.use(authMiddleware);

tarefaRoutes.get("/:id", asyncHandler((req, res) => tarefaController.buscarPorId(req, res)));
tarefaRoutes.put("/:id", asyncHandler((req, res) => tarefaController.atualizar(req, res)));
tarefaRoutes.delete("/:id", asyncHandler((req, res) => tarefaController.remover(req, res)));

export { etapaTarefaRoutes, tarefaRoutes };