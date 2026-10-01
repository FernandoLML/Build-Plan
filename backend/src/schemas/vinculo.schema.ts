// Caminho: /backend/src/schemas/vinculo.schema.ts
// Validação de entrada para Vínculos Material-Etapa (M4) — Zod.

import { z } from "zod";

export const statusVinculoEnum = z.enum(["PREVISTO", "RECEBIDO", "APLICADO"]);

export const createVinculoSchema = z.object({
  materialId: z.string().uuid("Identificador de material inválido."),
  etapaId: z.string().uuid("Identificador de etapa inválido."),
  // Vínculo exige quantidade estritamente positiva.
  quantidade: z
    .number({ required_error: "A quantidade é obrigatória." })
    .positive("A quantidade do vínculo deve ser maior que zero."),
  local: z.string().trim().max(160).optional(),
});

// Atualização de status (máquina de estados RN01). detalhes é um texto
// livre opcional registrado no log de rastreabilidade.
export const updateStatusVinculoSchema = z.object({
  status: statusVinculoEnum,
  detalhes: z.string().trim().max(500).optional(),
});

// Parâmetros de rota
export const vinculoIdParamSchema = z.object({
  id: z.string().uuid("Identificador de vínculo inválido."),
});

export type CreateVinculoInput = z.infer<typeof createVinculoSchema>;
export type UpdateStatusVinculoInput = z.infer<typeof updateStatusVinculoSchema>;