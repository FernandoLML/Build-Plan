// Caminho: /backend/src/scripts/importSinapi.ts
// Importador idempotente do catálogo SINAPI.
//
// Fonte configurável via env SINAPI_SOURCE (default: amostra versionada em
// prisma/seed/sinapi.sample.json). Aceita caminho de arquivo OU URL http(s)
// (Node 20+ tem fetch global), permitindo agendar a atualização mensal sem
// nenhum serviço vivo em paralelo. Reexecutar é seguro: faz upsert pela chave
// natural (codigo + uf + mesReferencia + anoReferencia + regime).
//
// Uso: npm run sinapi:import        (amostra local)
//      SINAPI_SOURCE=./dados.json npm run sinapi:import
//      SINAPI_SOURCE=https://.../sinapi-sc.json npm run sinapi:import
//
// AJUSTE o import do prisma client para o caminho real do seu projeto.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const registroSchema = z.object({
  codigo: z.string().trim().min(1),
  descricao: z.string().trim().min(1),
  unidade: z.string().trim().min(1),
  precoMediano: z.coerce.number().nonnegative(),
  uf: z.string().trim().length(2).transform((v) => v.toUpperCase()),
  mesReferencia: z.coerce.number().int().min(1).max(12),
  anoReferencia: z.coerce.number().int().min(2000).max(2100),
  regime: z.enum(["DESONERADO", "NAO_DESONERADO"]).default("NAO_DESONERADO"),
  tipo: z.enum(["INSUMO", "COMPOSICAO"]).default("INSUMO"),
});

const CHUNK = 500;

async function carregarFonte(source: string): Promise<unknown[]> {
  const conteudo = /^https?:\/\//i.test(source)
    ? await fetch(source).then((r) => {
        if (!r.ok) throw new Error(`Falha ao baixar a fonte (${r.status}).`);
        return r.text();
      })
    : await readFile(source, "utf-8");

  const json = JSON.parse(conteudo);
  if (!Array.isArray(json)) throw new Error("A fonte deve ser um array JSON de registros.");
  return json;
}

async function main() {
  const defaultPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../prisma/seed/sinapi.sample.json",
  );
  const source = process.env.SINAPI_SOURCE ?? defaultPath;
  console.log(`[sinapi] Fonte: ${source}`);

  const brutos = await carregarFonte(source);
  const registros = brutos.map((r, i) => {
    const parsed = registroSchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(`Registro inválido no índice ${i}: ${parsed.error.issues[0]?.message}`);
    }
    return parsed.data;
  });

  console.log(`[sinapi] ${registros.length} registros válidos. Importando…`);

  let processados = 0;
  for (let i = 0; i < registros.length; i += CHUNK) {
    const lote = registros.slice(i, i + CHUNK);
    await prisma.$transaction(
      lote.map((r) =>
        prisma.itemSinapi.upsert({
          where: {
            codigo_uf_mesReferencia_anoReferencia_regime: {
              codigo: r.codigo,
              uf: r.uf,
              mesReferencia: r.mesReferencia,
              anoReferencia: r.anoReferencia,
              regime: r.regime,
            },
          },
          create: r,
          update: {
            descricao: r.descricao,
            unidade: r.unidade,
            precoMediano: r.precoMediano,
            tipo: r.tipo,
          },
        }),
      ),
    );
    processados += lote.length;
    console.log(`[sinapi] ${processados}/${registros.length}`);
  }

  console.log("[sinapi] Importação concluída.");
}

main()
  .catch((err) => {
    console.error("[sinapi] Erro na importação:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });