// Caminho: /backend/src/schemas/lista-compras.schema.ts
// Validação de entrada para Listas de Compras (M4 — Fase 2).

import { z } from "zod";

// A geração é feita a partir dos vínculos da etapa; não há corpo obrigatório.
// Mantido como objeto para permitir extensões futuras (ex: filtros/observação).
export const gerarListaSchema = z.object({
  observacao: z.string().trim().max(500).optional(),
});

// Parâmetros de rota
export const etapaIdParamSchema = z.object({
  etapaId: z.string().uuid("Identificador de etapa inválido."),
});

export const obraIdParamSchema = z.object({
  obraId: z.string().uuid("Identificador de obra inválido."),
});

export const listaIdParamSchema = z.object({
  id: z.string().uuid("Identificador de lista inválido."),
});

export type GerarListaInput = z.infer<typeof gerarListaSchema>;