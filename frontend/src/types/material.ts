// Caminho: /frontend/src/types/material.ts
// Contratos de Material e Vínculo material-etapa (espelham a API real).
// Observação: valores Decimal (quantidade) são serializados como string pela API.

import { z } from "zod";

export type OrigemMaterial = "MANUAL" | "MEMORIAL";
export type StatusVinculo = "PREVISTO" | "RECEBIDO" | "APLICADO";

export interface Material {
  id: string;
  nome: string;
  especificacao: string | null;
  unidade: string;
  quantidade: string; // Decimal serializado
  origem: OrigemMaterial;
  codigoSinapi: string | null;
  obraId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VinculoMaterialEtapa {
  id: string;
  materialId: string;
  etapaId: string;
  quantidade: string; // Decimal serializado
  status: StatusVinculo;
  local: string | null;
  dataRecebimento: string | null;
  dataAplicacao: string | null;
  material?: Material; // incluído no GET por etapa
}

// ---- Formulário de edição de material ----
export const materialFormSchema = z.object({
  nome: z.string().trim().min(2, "O nome deve ter ao menos 2 caracteres.").max(160),
  especificacao: z.string().trim().max(1000).optional(),
  unidade: z.string().trim().min(1, "A unidade é obrigatória.").max(20),
  quantidade: z.coerce.number().nonnegative("A quantidade não pode ser negativa."),
});
export type MaterialFormValues = z.infer<typeof materialFormSchema>;

export interface UpdateMaterialPayload {
  nome?: string;
  especificacao?: string;
  unidade?: string;
  quantidade?: number;
  codigoSinapi?: string;
}

export interface CreateMaterialPayload {
  nome: string;
  especificacao?: string;
  unidade: string;
  quantidade?: number;
  origem?: OrigemMaterial;
  codigoSinapi?: string;
}

// ---- Formulário de vínculo material-etapa ----
export const vinculoFormSchema = z.object({
  etapaId: z.string().uuid("Selecione uma etapa."),
  quantidade: z.coerce.number().positive("A quantidade deve ser maior que zero."),
  local: z.string().trim().max(160).optional(),
});
export type VinculoFormValues = z.infer<typeof vinculoFormSchema>;

export interface CreateVinculoPayload {
  materialId: string;
  quantidade: number;
  local?: string;
}