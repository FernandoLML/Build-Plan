// Caminho: /backend/src/modules/sinapi/sinapi.schema.ts
// Validação (Zod) da query de busca no catálogo SINAPI.

import { z } from "zod";

export const buscarSinapiQuerySchema = z.object({
  q: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(120),
  uf: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase())
    .optional(),
  regime: z.enum(["DESONERADO", "NAO_DESONERADO"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type BuscarSinapiQuery = z.infer<typeof buscarSinapiQuerySchema>;