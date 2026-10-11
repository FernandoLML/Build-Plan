// Caminho: /backend/src/routes/lista-compras.routes.ts
// Rotas de Lista de Compras (M4 — Fase 2). Três exportações:
//  - etapaListaRoutes: geração aninhada em /api/etapas/:etapaId/lista-compras (mergeParams).
//  - obraListaRoutes: listagem aninhada em /api/obras/:obraId/listas-compras (mergeParams).
//  - listaRoutes: recursos individuais em /api/listas-compras/:id (+ itens aninhados).

import { Router } from "express";
import { listaComprasController } from "../controllers/lista-compras.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { listaItemRoutes } from "./item-compra.routes.js";

// Geração aninhada na etapa — montado dentro de etapa.routes.ts (herda authMiddleware).
const etapaListaRoutes = Router({ mergeParams: true });
etapaListaRoutes.post("/", asyncHandler((req, res) => listaComprasController.gerar(req, res)));

// Listagem aninhada na obra — montado dentro de obra.routes.ts (herda authMiddleware).
const obraListaRoutes = Router({ mergeParams: true });
obraListaRoutes.get("/", asyncHandler((req, res) => listaComprasController.listarPorObra(req, res)));

// Recursos individuais da lista — protegidos pelo authMiddleware.
const listaRoutes = Router();
listaRoutes.use(authMiddleware);

listaRoutes.get("/:id", asyncHandler((req, res) => listaComprasController.buscar(req, res)));
listaRoutes.delete("/:id", asyncHandler((req, res) => listaComprasController.remover(req, res)));

// Itens aninhados: /api/listas-compras/:listaId/itens
listaRoutes.use("/:listaId/itens", listaItemRoutes);

export { etapaListaRoutes, obraListaRoutes, listaRoutes };