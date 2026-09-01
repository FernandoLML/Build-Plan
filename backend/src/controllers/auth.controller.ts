// Caminho: /backend/src/controllers/auth.controller.ts
// Entrada HTTP da autenticação. Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

export class AuthController {
  public async registrar(req: Request, res: Response): Promise<Response> {
    const data = registerSchema.parse(req.body);
    const result = await authService.registrar(data);
    return res.status(201).json(result);
  }

  public async login(req: Request, res: Response): Promise<Response> {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    return res.status(200).json(result);
  }

  public async perfil(req: Request, res: Response): Promise<Response> {
    const usuario = await authService.perfil(req.userId);
    return res.status(200).json(usuario);
  }
}

export const authController = new AuthController();