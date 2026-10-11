// Caminho: /backend/src/schemas/memorial.schema.ts
// Validação de entrada do UC01 — extração/importação do Memorial Descritivo (M4 Fase 3).

import { z } from "zod";

// Um item extraído do memorial (mesma forma do material, origem = MEMORIAL).
export const itemMemorialSchema = z.object({
  nome: z
    .string({ required_error: "O nome é obrigatório." })
    .trim()
    .min(2, "O nome deve ter ao menos 2 caracteres.")
    .max(160),
  especificacao: z.string().trim().max(1000).optional(),
  unidade: z
    .string({ required_error: "A unidade é obrigatória." })
    .trim()
    .min(1, "A unidade é obrigatória.")
    .max(20),
  quantidade: z
    .number({ invalid_type_error: "A quantidade deve ser um número." })
    .positive("A quantidade deve ser maior que zero."),
  codigoSinapi: z.string().trim().max(30).optional(),
});

// Pré-visualização: aceita texto CSV OU uma lista prévia em JSON (uma das duas).
export const previewMemorialSchema = z
  .object({
    csv: z.string().optional(),
    itens: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .refine(
    (d) =>
      (typeof d.csv === "string" && d.csv.trim().length > 0) ||
      (Array.isArray(d.itens) && d.itens.length > 0),
    { message: "Envie 'csv' (texto) ou 'itens' (lista) não vazios." },
  );

// Importação em lote: lista já revisada e confirmada pelo usuário.
export const importMemorialSchema = z.object({
  itens: z
    .array(itemMemorialSchema)
    .min(1, "A lista de itens para importação não pode ser vazia."),
});

export type ItemMemorialInput = z.infer<typeof itemMemorialSchema>;
export type PreviewMemorialInput = z.infer<typeof previewMemorialSchema>;
export type ImportMemorialInput = z.infer<typeof importMemorialSchema>;