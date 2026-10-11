// Caminho: /backend/src/routes/item-compra.routes.ts
// Rotas de Item de Compra (M4 — Fase 2). Duas exportações:
//  - listaItemRoutes: aninhadas em /api/listas-compras/:listaId/itens (mergeParams).
//  - itemRoutes: recursos individuais em /api/itens-compra/:id.

import { Router } from "express";
import { itemCompraController } from "../controllers/item-compra.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

// mergeParams: true garante acesso ao :listaId da rota pai.
// Montado DENTRO de lista-compras.routes.ts, que já aplica o authMiddleware.
const listaItemRoutes = Router({ mergeParams: true });

listaItemRoutes.post("/", asyncHandler((req, res) => itemCompraController.adicionar(req, res)));

// Recursos individuais de item — protegidos pelo authMiddleware.
const itemRoutes = Router();
itemRoutes.use(authMiddleware);

itemRoutes.patch("/:id", asyncHandler((req, res) => itemCompraController.atualizar(req, res)));
itemRoutes.delete("/:id", asyncHandler((req, res) => itemCompraController.remover(req, res)));

export { listaItemRoutes, itemRoutes };