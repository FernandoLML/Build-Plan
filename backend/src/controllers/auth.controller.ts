// Caminho: /backend/src/controllers/auth.controller.ts
// Entrada HTTP da autenticação. Valida com Zod e delega ao service.

import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { recuperacaoSenhaService } from "../services/recuperacao-senha.service.js";
import { contaService } from "../services/conta.service.js";
import {
  registerSchema,
  loginSchema,
  esqueciSenhaSchema,
  redefinirSenhaSchema,
  atualizarPerfilSchema,
  excluirContaSchema,
} from "../schemas/auth.schema.js";

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

  // POST /api/auth/esqueci-senha — resposta idêntica com ou sem conta.
  public async esqueciSenha(req: Request, res: Response): Promise<Response> {
    const { email } = esqueciSenhaSchema.parse(req.body);
    await recuperacaoSenhaService.solicitar(email);
    return res.status(200).json({
      message: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.",
    });
  }

  // POST /api/auth/redefinir-senha
  public async redefinirSenha(req: Request, res: Response): Promise<Response> {
    const { token, senha } = redefinirSenhaSchema.parse(req.body);
    await recuperacaoSenhaService.redefinir(token, senha);
    return res.status(200).json({ message: "Senha redefinida. Faça login com a nova senha." });
  }

  // PUT /api/auth/me
  public async atualizarPerfil(req: Request, res: Response): Promise<Response> {
    const data = atualizarPerfilSchema.parse(req.body);
    const usuario = await contaService.atualizarPerfil(req.userId, data);
    return res.status(200).json(usuario);
  }

  // DELETE /api/auth/me — exige a senha atual no corpo.
  public async excluirConta(req: Request, res: Response): Promise<Response> {
    const { senha } = excluirContaSchema.parse(req.body);
    await contaService.excluirConta(req.userId, senha);
    return res.status(204).send();
  }
}

export const authController = new AuthController();