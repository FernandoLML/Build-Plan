// Caminho: /backend/src/scripts/importSinapi.ts
// Importador do catálogo SINAPI. Aceita a planilha oficial (.xlsx) OU um JSON
// (amostra). Estratégia "replace-by-competência": apaga o slice
// (uf+mês+ano+regime) e insere em lote com createMany (chunks), tudo numa
// transação — idempotente (reexecutar substitui a competência) e rápido.
//
// Uso:
//   npm run sinapi:import                       # usa SINAPI_SOURCE ou a amostra
//   SINAPI_SOURCE="prisma/seed/sinapi/SINAPI 202609 SC.xlsx" npm run sinapi:import
//   SINAPI_UF=SC SINAPI_MES=9 SINAPI_ANO=2026 npm run sinapi:import
//
// Competência: derivada do nome do arquivo (…YYYYMM… e sufixo UF) quando possível,
// com override por env (SINAPI_UF / SINAPI_MES / SINAPI_ANO / SINAPI_REGIME).
//
// AJUSTE o import do prisma client para o caminho real do seu projeto.

import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parsePlanilhaSinapi } from "../modules/sinapi/sinapi.parser.js";
import type { RegistroSinapi } from "../modules/sinapi/sinapi.parser.js";
import { normalizarCodigoSinapi } from "../modules/sinapi/sinapi.codigo.js";

const CHUNK = 1000;

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

type Competencia = Pick<RegistroSinapi, "uf" | "mesReferencia" | "anoReferencia" | "regime">;

// Deriva competência do nome do arquivo (ex.: "SINAPI 202609 SC.xlsx") + env.
function resolverCompetencia(source: string): Competencia {
  const nome = basename(source);
  const mAno = /(\d{4})(\d{2})/.exec(nome);
  const mUf = /\b([A-Z]{2})\b(?=\.[^.]+$)/.exec(nome.toUpperCase());

  const uf = (process.env.SINAPI_UF ?? mUf?.[1] ?? "SC").toUpperCase();
  const anoReferencia = Number(process.env.SINAPI_ANO ?? mAno?.[1] ?? NaN);
  const mesReferencia = Number(process.env.SINAPI_MES ?? mAno?.[2] ?? NaN);
  const regime = (process.env.SINAPI_REGIME ?? "NAO_DESONERADO") as Competencia["regime"];

  if (!Number.isInteger(anoReferencia) || !Number.isInteger(mesReferencia)) {
    throw new Error(
      "Competência indefinida. Informe no nome do arquivo (…YYYYMM…) ou via SINAPI_ANO/SINAPI_MES.",
    );
  }
  return { uf, mesReferencia, anoReferencia, regime };
}

async function obterRegistros(source: string): Promise<RegistroSinapi[]> {
  if (/\.xlsx?$/i.test(source)) {
    const comp = resolverCompetencia(source);
    console.log(`[sinapi] Planilha | UF=${comp.uf} ${comp.mesReferencia}/${comp.anoReferencia} (${comp.regime})`);
    return parsePlanilhaSinapi(source, comp);
  }
  // Fallback JSON (amostra): array de registros já no formato do schema.
  const conteudo = /^https?:\/\//i.test(source)
    ? await fetch(source).then((r) => {
        if (!r.ok) throw new Error(`Falha ao baixar a fonte (${r.status}).`);
        return r.text();
      })
    : await readFile(source, "utf-8");
  const json = JSON.parse(conteudo);
  if (!Array.isArray(json)) throw new Error("A fonte JSON deve ser um array de registros.");
  return json.map((r, i) => {
    const parsed = registroSchema.safeParse(r);
    if (!parsed.success) {
      throw new Error(`Registro inválido no índice ${i}: ${parsed.error.issues[0]?.message}`);
    }
    return {
      ...parsed.data,
      codigoNormalizado: normalizarCodigoSinapi(parsed.data.codigo) ?? parsed.data.codigo,
    };
  });
}

async function main() {
  const defaultPath = resolve(
    fileURLToPath(new URL("../../prisma/seed/sinapi.sample.json", import.meta.url)),
  );
  const source = process.env.SINAPI_SOURCE ?? defaultPath;
  console.log(`[sinapi] Fonte: ${source}`);

  const registros = await obterRegistros(source);
  if (registros.length === 0) {
    console.warn("[sinapi] Nenhum registro válido encontrado. Abortando.");
    return;
  }

  // Competência única do lote (todos os registros compartilham a mesma).
  const { uf, mesReferencia, anoReferencia, regime } = registros[0]!;
  console.log(`[sinapi] ${registros.length} registros válidos. Substituindo competência…`);

  await prisma.$transaction(
    async (tx) => {
      const removidos = await tx.itemSinapi.deleteMany({
        where: { uf, mesReferencia, anoReferencia, regime },
      });
      if (removidos.count > 0) console.log(`[sinapi] ${removidos.count} registros antigos removidos.`);

      for (let i = 0; i < registros.length; i += CHUNK) {
        const lote = registros.slice(i, i + CHUNK);
        await tx.itemSinapi.createMany({ data: lote });
        console.log(`[sinapi] inseridos ${Math.min(i + CHUNK, registros.length)}/${registros.length}`);
      }
    },
    { timeout: 120_000 },
  );

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