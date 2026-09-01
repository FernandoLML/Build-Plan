// Caminho: /backend/src/services/auth.service.ts
// Camada de negócio da autenticação: hash bcrypt, verificação de senha e
// emissão de JWT. Nunca retorna o hash da senha (Seção 6.1 do RFC).

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { env } from "../config/env.js";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema.js";

const BCRYPT_COST = 12; // fator mínimo exigido pelo RFC (Seção 6.1)

interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  papel: string;
}

interface AuthResult {
  usuario: UsuarioPublico;
  token: string;
}

export class AuthService {
  /** Registra um novo usuário com a senha armazenada como hash bcrypt. */
  public async registrar(data: RegisterInput): Promise<AuthResult> {
    const existente = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existente) {
      throw new AppError("E-mail já cadastrado.", 409);
    }

    const senhaHash = await bcrypt.hash(data.senha, BCRYPT_COST);

    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senhaHash,
        papel: data.papel ?? "GESTOR",
      },
      select: { id: true, nome: true, email: true, papel: true },
    });

    const token = this.gerarToken(usuario.id);
    return { usuario, token };
  }

  /** Autentica por e-mail/senha e devolve um JWT assinado. */
  public async login(data: LoginInput): Promise<AuthResult> {
    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    // Mensagem genérica para não revelar se o e-mail existe (Seção 6.1).
    if (!usuario) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    const senhaConfere = await bcrypt.compare(data.senha, usuario.senhaHash);
    if (!senhaConfere) {
      throw new AppError("Credenciais inválidas.", 401);
    }

    const token = this.gerarToken(usuario.id);
    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      },
      token,
    };
  }

  /** Retorna o perfil do usuário autenticado (rota /me). */
  public async perfil(usuarioId: string): Promise<UsuarioPublico> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nome: true, email: true, papel: true },
    });

    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    return usuario;
  }

  /** Assina um JWT (HS256) contendo o id do usuário no claim `sub`. */
  private gerarToken(usuarioId: string): string {
    return jwt.sign({}, env.JWT_SECRET, {
      subject: usuarioId,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
    });
  }
}

export const authService = new AuthService();