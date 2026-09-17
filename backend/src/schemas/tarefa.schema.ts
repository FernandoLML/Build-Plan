// Caminho: /backend/src/schemas/tarefa.schema.ts
// Validação de entrada para Tarefas (M3) — Zod.

import { z } from "zod";

// Datas em formato ISO 8601 (ex: "2026-09-07T12:00:00Z"), convertidas para Date.
const isoDate = z
  .string()
  .datetime({ offset: true, message: "Data deve estar em formato ISO 8601." })
  .transform((s) => new Date(s));

export const statusTarefaEnum = z.enum([
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "BLOQUEADA",
]);

export const createTarefaSchema = z.object({
  titulo: z
    .string({ required_error: "O título da tarefa é obrigatório." })
    .trim()
    .min(3, "O título deve ter ao menos 3 caracteres.")
    .max(160),
  descricao: z.string().trim().max(2000).optional(),
  status: statusTarefaEnum.optional(), // default PENDENTE aplicado pelo Prisma
  dataInicioPrev: isoDate.optional(),
  dataFimPrev: isoDate.optional(),
  dataConclusao: isoDate.optional(),
  ordem: z.number().int().min(0, "A ordem não pode ser negativa.").optional(),
});

export const updateTarefaSchema = createTarefaSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Informe ao menos um campo para atualizar." },
);

// Parâmetros de rota
export const tarefaIdParamSchema = z.object({
  id: z.string().uuid("Identificador de tarefa inválido."),
});

export type CreateTarefaInput = z.infer<typeof createTarefaSchema>;
export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>;