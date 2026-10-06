// Caminho: /backend/src/schemas/item-compra.schema.ts
// Validação de entrada para Itens de Compra (M4 — Fase 2).

import { z } from "zod";

export const origemPrecoEnum = z.enum(["SINAPI", "MANUAL", "PENDENTE"]);

// Adição manual de um item à lista (ex: insumo fora do catálogo).
export const addItemSchema = z.object({
  materialId: z.string().uuid("Identificador de material inválido.").optional(),
  descricao: z
    .string({ required_error: "A descrição é obrigatória." })
    .trim()
    .min(2, "A descrição deve ter ao menos 2 caracteres.")
    .max(200),
  unidade: z
    .string({ required_error: "A unidade é obrigatória." })
    .trim()
    .min(1, "A unidade é obrigatória.")
    .max(20),
  quantidade: z
    .number({ required_error: "A quantidade é obrigatória." })
    .positive("A quantidade deve ser maior que zero."),
  // Preço informado manualmente ("Informar" na Tela 5). Opcional na criação.
  precoUnitario: z.number().nonnegative("O preço não pode ser negativo.").optional(),
});

// Atualização de item — tipicamente para "Informar" o preço de cotação manual.
export const updateItemSchema = z
  .object({
    descricao: z.string().trim().min(2).max(200).optional(),
    unidade: z.string().trim().min(1).max(20).optional(),
    quantidade: z.number().positive("A quantidade deve ser maior que zero.").optional(),
    precoUnitario: z.number().nonnegative("O preço não pode ser negativo.").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

// Parâmetros de rota
export const listaIdParamSchema = z.object({
  listaId: z.string().uuid("Identificador de lista inválido."),
});

export const itemIdParamSchema = z.object({
  id: z.string().uuid("Identificador de item inválido."),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;