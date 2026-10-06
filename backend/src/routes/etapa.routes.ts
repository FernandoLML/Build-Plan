// Caminho: /backend/src/routes/etapa.routes.ts
// Rotas de Etapa (M3) + vínculos de material (M4 Fase 1) + lista de compras (M4 Fase 2).
//  - obraEtapaRoutes: aninhadas em /api/obras/:obraId/etapas (mergeParams).
//  - etapaRoutes: recursos individuais em /api/etapas/:etapaId (+ aninhados).

import { Router } from "express";
import { etapaController } from "../controllers/etapa.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { etapaTarefaRoutes } from "./tarefa.routes.js";
import { etapaMaterialRoutes } from "./vinculo.routes.js";
import { etapaListaRoutes } from "./lista-compras.routes.js";

// mergeParams: true garante acesso ao :obraId da rota pai.
// Este router é montado DENTRO de obra.routes.ts, que já aplica o authMiddleware.
const obraEtapaRoutes = Router({ mergeParams: true });

obraEtapaRoutes.get("/", asyncHandler((req, res) => etapaController.listar(req, res)));
obraEtapaRoutes.post("/", asyncHandler((req, res) => etapaController.criar(req, res)));

// Recursos individuais de etapa — protegidos pelo authMiddleware.
const etapaRoutes = Router();
etapaRoutes.use(authMiddleware);

etapaRoutes.put("/:etapaId", asyncHandler((req, res) => etapaController.atualizar(req, res)));
etapaRoutes.delete("/:etapaId", asyncHandler((req, res) => etapaController.remover(req, res)));

// Tarefas aninhadas: /api/etapas/:etapaId/tarefas
etapaRoutes.use("/:etapaId/tarefas", etapaTarefaRoutes);

// Vínculos material-etapa aninhados: /api/etapas/:etapaId/materiais
etapaRoutes.use("/:etapaId/materiais", etapaMaterialRoutes);

// Geração de lista de compras: /api/etapas/:etapaId/lista-compras
etapaRoutes.use("/:etapaId/lista-compras", etapaListaRoutes);

export { obraEtapaRoutes, etapaRoutes };