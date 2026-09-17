// Caminho: /backend/src/schemas/etapa.schema.ts
// Validação de entrada para Etapas (M3) — Zod.

import { z } from "zod";

export const createEtapaSchema = z.object({
  nome: z
    .string({ required_error: "O nome da etapa é obrigatório." })
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres.")
    .max(120),
  descricao: z.string().trim().max(1000).optional(),
  ordem: z.number().int().min(0, "A ordem não pode ser negativa.").optional(),
});

export const updateEtapaSchema = createEtapaSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Informe ao menos um campo para atualizar." },
);

// Parâmetros de rota
export const obraIdParamSchema = z.object({
  obraId: z.string().uuid("Identificador de obra inválido."),
});

export const etapaIdParamSchema = z.object({
  etapaId: z.string().uuid("Identificador de etapa inválido."),
});

export type CreateEtapaInput = z.infer<typeof createEtapaSchema>;
export type UpdateEtapaInput = z.infer<typeof updateEtapaSchema>;