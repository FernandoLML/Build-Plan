// Caminho: /backend/src/schemas/obra.schema.ts
// Validação de entrada com Zod (RNF02 — Confiabilidade / RF01).

import { z } from "zod";

export const createObraSchema = z.object({
  nome: z
    .string({ required_error: "O nome da obra é obrigatório." })
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  descricao: z.string().trim().max(1000).optional(),
  endereco: z.string().trim().max(255).optional(),
});

// Todos os campos opcionais na atualização, mas ao menos um deve ser enviado.
export const updateObraSchema = createObraSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Informe ao menos um campo para atualizar." },
);

export const obraIdParamSchema = z.object({
  id: z.string().uuid("Identificador de obra inválido."),
});

// Tipos inferidos — reutilizados no service e controller.
export type CreateObraInput = z.infer<typeof createObraSchema>;
export type UpdateObraInput = z.infer<typeof updateObraSchema>;