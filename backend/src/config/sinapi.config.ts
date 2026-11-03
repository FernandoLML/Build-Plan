// Caminho: /backend/src/config/sinapi.config.ts
// Competência/UF de referência padrão para a precificação automática via SINAPI.
// Validada por Zod com fallback para os defaults acordados (SC 09/2026, sem deson.).
// Pode ser dobrada no seu módulo central de env, se preferir.

import { z } from "zod";

const schema = z.object({
  SINAPI_UF_PADRAO: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase())
    .default("SC"),
  SINAPI_MES_PADRAO: z.coerce.number().int().min(1).max(12).default(9),
  SINAPI_ANO_PADRAO: z.coerce.number().int().min(2000).max(2100).default(2026),
  SINAPI_REGIME_PADRAO: z.enum(["DESONERADO", "NAO_DESONERADO"]).default("NAO_DESONERADO"),
});

const env = schema.parse(process.env);

export const sinapiConfig = {
  uf: env.SINAPI_UF_PADRAO,
  mesReferencia: env.SINAPI_MES_PADRAO,
  anoReferencia: env.SINAPI_ANO_PADRAO,
  regime: env.SINAPI_REGIME_PADRAO,
} as const;

export type SinapiConfig = typeof sinapiConfig;