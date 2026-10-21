// Caminho: /frontend/src/types/obra.ts
// Contrato da entidade Obra (espelha a resposta da API) e validação Zod.

import { z } from "zod";

export interface Obra {
  id: string;
  nome: string;
  descricao: string | null;
  endereco: string | null;
  usuarioId: string;
  createdAt: string; // ISO — serializado pela API
  updatedAt: string;
}

// Formulário de criação/edição. Strings vazias são aceitas no form e
// convertidas para `undefined` antes do envio (ver toObraPayload).
export const obraFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "O nome deve ter ao menos 3 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  descricao: z.string().trim().max(1000, "Máximo de 1000 caracteres.").optional(),
  endereco: z.string().trim().max(255, "Máximo de 255 caracteres.").optional(),
});

export type ObraFormValues = z.infer<typeof obraFormSchema>;

export interface CreateObraPayload {
  nome: string;
  descricao?: string;
  endereco?: string;
}

export type UpdateObraPayload = Partial<CreateObraPayload>;

// Normaliza o formulário para o payload da API (remove campos vazios).
export function toObraPayload(values: ObraFormValues): CreateObraPayload {
  return {
    nome: values.nome,
    descricao: values.descricao ? values.descricao : undefined,
    endereco: values.endereco ? values.endereco : undefined,
  };
}