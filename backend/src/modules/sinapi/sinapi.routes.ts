// Caminho: /backend/src/modules/sinapi/sinapi.routes.ts
// Router do catálogo SINAPI. Leitura protegida pelo authMiddleware JWT padrão.

import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { getSinapi } from "./sinapi.controller.js";

export const sinapiRouter = Router();

// GET /api/sinapi?q=&uf=&regime=&limit=  (requer Authorization: Bearer <token>)
sinapiRouter.get("/", authMiddleware, asyncHandler(getSinapi));