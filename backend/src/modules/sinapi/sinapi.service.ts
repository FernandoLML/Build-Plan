// Caminho: /backend/src/modules/sinapi/sinapi.service.ts
// Regras de busca no catálogo SINAPI. Usa ILIKE (via `contains`/`startsWith`
// insensitive) que aproveita o índice GIN/pg_trgm em `descricao`.
// AJUSTE o import do prisma client para o caminho real do seu projeto.

import { prisma } from "../../lib/prisma.js";
import type { BuscarSinapiQuery } from "./sinapi.schema.js";

export async function buscarSinapi(params: BuscarSinapiQuery) {
  const { q, uf, regime, limit } = params;

  return prisma.itemSinapi.findMany({
    where: {
      ...(uf ? { uf } : {}),
      ...(regime ? { regime } : {}),
      OR: [
        { descricao: { contains: q, mode: "insensitive" } },
        { codigo: { startsWith: q } },
      ],
    },
    // Prioriza quem casa pelo código; depois ordem alfabética estável.
    orderBy: [{ codigo: "asc" }, { descricao: "asc" }],
    take: limit,
  });
}