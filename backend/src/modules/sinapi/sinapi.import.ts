// Caminho: /backend/src/modules/sinapi/sinapi.import.ts
// Regras puras do importador SINAPI (sem I/O nem banco), extraídas de
// scripts/importSinapi.ts para serem testáveis isoladamente:
//  - resolução da fonte (SINAPI_SOURCE com fallback para a amostra);
//  - resolução/validação da competência (nome do arquivo + env), via Zod;
//  - schema dos registros da fonte JSON.

import { basename } from "node:path";
import { z } from "zod";
import type { RegistroSinapi } from "./sinapi.parser.js";

type Env = Record<string, string | undefined>;

export const regimeSinapiEnum = z.enum(["DESONERADO", "NAO_DESONERADO"]);
export const tipoSinapiEnum = z.enum(["INSUMO", "COMPOSICAO"]);

const uf = z
  .string()
  .trim()
  .length(2, "UF deve ter 2 letras.")
  .transform((v) => v.toUpperCase());
const mesReferencia = z.coerce
  .number({ invalid_type_error: "Mês de referência inválido." })
  .int("Mês de referência deve ser inteiro.")
  .min(1, "Mês de referência deve estar entre 1 e 12.")
  .max(12, "Mês de referência deve estar entre 1 e 12.");
const anoReferencia = z.coerce
  .number({ invalid_type_error: "Ano de referência inválido." })
  .int("Ano de referência deve ser inteiro.")
  .min(2000)
  .max(2100);

/** Registro da fonte JSON (amostra), já no formato do catálogo. */
export const registroSinapiSchema = z.object({
  codigo: z.string().trim().min(1),
  descricao: z.string().trim().min(1),
  unidade: z.string().trim().min(1),
  precoMediano: z.coerce.number().nonnegative(),
  uf,
  mesReferencia,
  anoReferencia,
  regime: regimeSinapiEnum.default("NAO_DESONERADO"),
  tipo: tipoSinapiEnum.default("INSUMO"),
});

const competenciaSchema = z.object({ uf, mesReferencia, anoReferencia, regime: regimeSinapiEnum });

export type Competencia = Pick<RegistroSinapi, "uf" | "mesReferencia" | "anoReferencia" | "regime">;

/** Valor de env "preenchido": trata ausente, vazio e só-espaços como não informado. */
export function envPreenchida(valor: string | undefined): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

/** Fonte da importação: SINAPI_SOURCE (se preenchida) ou o caminho padrão. */
export function resolverFonteSinapi(env: Env, caminhoPadrao: string): string {
  return envPreenchida(env.SINAPI_SOURCE) || caminhoPadrao;
}

/**
 * Deriva a competência do nome do arquivo (ex.: "SINAPI 202609 SC.xlsx") com
 * override por env (SINAPI_UF / SINAPI_MES / SINAPI_ANO / SINAPI_REGIME).
 * Valida tudo via Zod: mês 1–12, ano 2000–2100, UF com 2 letras e regime do enum.
 */
export function resolverCompetencia(source: string, env: Env): Competencia {
  const nome = basename(source);
  const mAno = /(\d{4})(\d{2})/.exec(nome);
  const mUf = /\b([A-Z]{2})\b(?=\.[^.]+$)/.exec(nome.toUpperCase());

  const ano = envPreenchida(env.SINAPI_ANO) ?? mAno?.[1];
  const mes = envPreenchida(env.SINAPI_MES) ?? mAno?.[2];
  if (ano === undefined || mes === undefined) {
    throw new Error(
      "Competência indefinida. Informe no nome do arquivo (…YYYYMM…) ou via SINAPI_ANO/SINAPI_MES.",
    );
  }

  const parsed = competenciaSchema.safeParse({
    uf: envPreenchida(env.SINAPI_UF) ?? mUf?.[1] ?? "SC",
    mesReferencia: mes,
    anoReferencia: ano,
    regime: envPreenchida(env.SINAPI_REGIME)?.toUpperCase() ?? "NAO_DESONERADO",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Competência inválida (${issue?.path.join(".")}): ${issue?.message}`);
  }
  return parsed.data;
}

/**
 * Competência única do lote. O import substitui UM slice (uf+mês+ano+regime);
 * um JSON com competências misturadas inseriria registros sem apagar os
 * antigos do respectivo slice (violando o @@unique) — por isso é rejeitado.
 */
export function competenciaDoLote(registros: ReadonlyArray<Competencia>): Competencia {
  const [primeiro] = registros;
  if (!primeiro) throw new Error("Lote vazio: nenhuma competência para importar.");
  const chave = (c: Competencia) => `${c.uf}|${c.mesReferencia}|${c.anoReferencia}|${c.regime}`;
  const divergente = registros.find((r) => chave(r) !== chave(primeiro));
  if (divergente) {
    throw new Error(
      `O lote mistura competências (${chave(primeiro)} e ${chave(divergente)}). Importe uma por vez.`,
    );
  }
  const { uf, mesReferencia, anoReferencia, regime } = primeiro;
  return { uf, mesReferencia, anoReferencia, regime };
}
