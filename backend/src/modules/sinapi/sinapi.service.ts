// Caminho: /backend/src/modules/sinapi/sinapi.service.ts
// Regras de busca no catálogo SINAPI. Usa ILIKE (via `contains`/`startsWith`
// insensitive) que aproveita o índice GIN/pg_trgm em `descricao`.

import { prisma } from "../../lib/prisma.js";
import type { BuscarSinapiQuery } from "./sinapi.schema.js";
import { normalizarCodigoSinapi } from "./sinapi.codigo.js";

export async function buscarSinapi(params: BuscarSinapiQuery) {
  const { q, uf, regime, limit } = params;
  // "370" também encontra "00000370" (mesma normalização da precificação).
  const codigoNormalizado = normalizarCodigoSinapi(q) ?? q;

  return prisma.itemSinapi.findMany({
    where: {
      ...(uf ? { uf } : {}),
      ...(regime ? { regime } : {}),
      OR: [
        { descricao: { contains: q, mode: "insensitive" } },
        { codigo: { startsWith: q } },
        { codigoNormalizado: { startsWith: codigoNormalizado } },
      ],
    },
    // Prioriza quem casa pelo código; depois ordem alfabética estável.
    orderBy: [{ codigo: "asc" }, { descricao: "asc" }],
    take: limit,
  });
}