// Caminho: /backend/src/routes/auth.routes.ts
// Rotas de autenticação. /register e /login são públicas; /me é protegida.

import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const authRoutes = Router();

authRoutes.post("/register", asyncHandler((req, res) => authController.registrar(req, res)));
authRoutes.post("/login", asyncHandler((req, res) => authController.login(req, res)));
authRoutes.get("/me", authMiddleware, asyncHandler((req, res) => authController.perfil(req, res)));

export { authRoutes };