// Caminho: /frontend/src/types/etapa.ts
// Tipos de Etapa.

import { z } from "zod";

// Etapa "crua" (resposta de POST /api/obras/:obraId/etapas).
export interface Etapa {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  obraId: string;
  createdAt: string;
  updatedAt: string;
}

// Etapa com progresso (resposta de GET /api/obras/:obraId/etapas — M3).
export interface EtapaComProgresso {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  obraId: string;
  totalTarefas: number;
  tarefasConcluidas: number;
  progresso: number; // 0–100
}

export const etapaFormSchema = z.object({
  nome: z.string().trim().min(3, "O nome deve ter ao menos 3 caracteres.").max(120),
  ordem: z.coerce.number().int().min(0, "A ordem não pode ser negativa.").optional(),
});
export type EtapaFormValues = z.infer<typeof etapaFormSchema>;

export interface CreateEtapaPayload {
  nome: string;
  ordem?: number;
}