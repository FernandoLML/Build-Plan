// Caminho: /backend/src/schemas/auth.schema.ts
// Validação de entrada de autenticação com Zod (RNF02 / Seção 6.1).

import { z } from "zod";

export const registerSchema = z.object({
  nome: z
    .string({ required_error: "O nome é obrigatório." })
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres.")
    .max(120),
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .toLowerCase()
    .email("E-mail inválido."),
  senha: z
    .string({ required_error: "A senha é obrigatória." })
    .min(8, "A senha deve ter ao menos 8 caracteres.")
    .max(72, "A senha deve ter no máximo 72 caracteres."), // limite do bcrypt
  papel: z.enum(["GESTOR", "PROPRIETARIO"]).optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .toLowerCase()
    .email("E-mail inválido."),
  senha: z.string({ required_error: "A senha é obrigatória." }).min(1, "A senha é obrigatória."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;