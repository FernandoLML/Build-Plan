// Caminho: /backend/src/schemas/material.schema.ts
// Validação de entrada para Materiais / insumos (M4) — Zod.

import { z } from "zod";

export const origemMaterialEnum = z.enum(["MANUAL", "MEMORIAL"]);

export const createMaterialSchema = z.object({
  nome: z
    .string({ required_error: "O nome do material é obrigatório." })
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres.")
    .max(160),
  especificacao: z.string().trim().max(1000).optional(),
  unidade: z
    .string({ required_error: "A unidade é obrigatória." })
    .trim()
    .min(1, "A unidade é obrigatória.")
    .max(20), // ex: "kg", "m3", "un", "saco"
  // RN03: quantidades não podem ser negativas.
  quantidade: z
    .number({ invalid_type_error: "A quantidade deve ser um número." })
    .nonnegative("A quantidade não pode ser negativa.")
    .optional(),
  origem: origemMaterialEnum.optional(), // default MANUAL aplicado pelo Prisma
  codigoSinapi: z.string().trim().max(30).optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Informe ao menos um campo para atualizar." },
);

// Parâmetros de rota (usados pelos controllers da próxima fase).
export const obraIdParamSchema = z.object({
  obraId: z.string().uuid("Identificador de obra inválido."),
});

export const materialIdParamSchema = z.object({
  id: z.string().uuid("Identificador de material inválido."),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;