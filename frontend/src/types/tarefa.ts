// Caminho: /frontend/src/types/tarefa.ts
// Tipos de Tarefa (M3) — espelham o model Prisma `Tarefa` e os schemas Zod
// do backend (backend/src/schemas/tarefa.schema.ts).

import { z } from "zod";

export type StatusTarefa = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "BLOQUEADA";

/** Ordem canônica de exibição dos status (seletor rápido, legendas). */
export const STATUS_TAREFA: readonly StatusTarefa[] = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "BLOQUEADA",
] as const;

export const STATUS_TAREFA_LABEL: Record<StatusTarefa, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  BLOQUEADA: "Bloqueada",
};

// Resposta de GET /api/etapas/:etapaId/tarefas e GET/POST/PUT de tarefa.
// Datas chegam serializadas em ISO 8601.
export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  dataInicioPrev: string | null;
  dataFimPrev: string | null;
  dataConclusao: string | null;
  ordem: number;
  etapaId: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/etapas/:etapaId/tarefas — datas em ISO 8601 com offset.
export interface CreateTarefaPayload {
  titulo: string;
  descricao?: string;
  status?: StatusTarefa;
  dataInicioPrev?: string;
  dataFimPrev?: string;
  dataConclusao?: string;
  ordem?: number;
}

// PUT /api/tarefas/:id — parcial, mas o backend exige ao menos um campo.
export type UpdateTarefaPayload = Partial<CreateTarefaPayload>;

// ---- Formulário (inputs type="date" produzem "YYYY-MM-DD" ou "") ----
const dataOpcional = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Data inválida.")
  .optional();

export const tarefaFormSchema = z
  .object({
    titulo: z.string().trim().min(3, "O título deve ter ao menos 3 caracteres.").max(160),
    descricao: z.string().trim().max(2000).optional(),
    status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "BLOQUEADA"]),
    dataInicioPrev: dataOpcional,
    dataFimPrev: dataOpcional,
  })
  .refine(
    (v) => !v.dataInicioPrev || !v.dataFimPrev || v.dataFimPrev >= v.dataInicioPrev,
    { message: "O término deve ser igual ou posterior ao início.", path: ["dataFimPrev"] },
  );

export type TarefaFormValues = z.infer<typeof tarefaFormSchema>;
