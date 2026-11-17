// Caminho: /backend/src/routes/auth.routes.ts
// Rotas de autenticação. Cadastro, login e recuperação de senha são públicas;
// /me (perfil, edição e exclusão da conta) é protegida.

import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const authRoutes = Router();

authRoutes.post("/register", asyncHandler((req, res) => authController.registrar(req, res)));
authRoutes.post("/login", asyncHandler((req, res) => authController.login(req, res)));
authRoutes.post("/esqueci-senha", asyncHandler((req, res) => authController.esqueciSenha(req, res)));
authRoutes.post("/redefinir-senha", asyncHandler((req, res) => authController.redefinirSenha(req, res)));

authRoutes.get("/me", authMiddleware, asyncHandler((req, res) => authController.perfil(req, res)));
authRoutes.put("/me", authMiddleware, asyncHandler((req, res) => authController.atualizarPerfil(req, res)));
authRoutes.delete("/me", authMiddleware, asyncHandler((req, res) => authController.excluirConta(req, res)));

export { authRoutes };