// Caminho: /backend/src/config/env.ts
// Centraliza e valida as variáveis de ambiente na inicialização.
// Falha rápido (fail-fast) se algo essencial estiver faltando e, em produção,
// também se algum valor for inseguro (segredo de exemplo, CORS sem HTTPS etc.).

import "dotenv/config";
import { z } from "zod";

const JWT_MIN_DEV = 16;
const JWT_MIN_PRODUCAO = 32;

// Trechos que denunciam um valor copiado de exemplo/CI em vez de um segredo real.
const TRECHOS_INSEGUROS = ["troque", "changeme", "change-me", "nao-usar", "example", "exemplo", "dev_password"];

function pareceValorDeExemplo(valor: string): boolean {
  const v = valor.toLowerCase();
  return TRECHOS_INSEGUROS.some((trecho) => v.includes(trecho));
}

function ehUrlPostgres(valor: string): boolean {
  try {
    const { protocol } = new URL(valor);
    return protocol === "postgresql:" || protocol === "postgres:";
  } catch {
    return false;
  }
}

/** Origem válida para o CORS: só esquema + host (+ porta), sem caminho. */
function ehOrigemValida(origem: string): boolean {
  try {
    const url = new URL(origem);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === origem;
  } catch {
    return false;
  }
}

function ehOrigemDeProducao(origem: string): boolean {
  const url = new URL(origem);
  return url.protocol === "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1";
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3333),
    DATABASE_URL: z
      .string({ required_error: "DATABASE_URL é obrigatória." })
      .refine(ehUrlPostgres, "DATABASE_URL deve ser uma URL postgresql://."),
    JWT_SECRET: z
      .string({ required_error: "JWT_SECRET é obrigatória." })
      .min(JWT_MIN_DEV, `JWT_SECRET deve ter ao menos ${JWT_MIN_DEV} caracteres.`),
    JWT_EXPIRES_IN: z.string().default("8h"),
    // Origens autorizadas pelo CORS, separadas por vírgula. Nunca "*".
    // Sem default em produção (ver superRefine): lá a origem tem de ser explícita.
    CORS_ORIGINS: z
      .string()
      .optional()
      .transform((v) =>
        (v ?? "")
          .split(",")
          .map((o) => o.trim())
          .filter((o) => o.length > 0),
      ),
    // Nº de proxies reversos confiáveis à frente da API (Nginx = 1). Define de
    // onde vem o IP do cliente (X-Forwarded-For) usado pelo rate limit.
    // Default: 1 em produção, 0 fora dela (sem proxy, o header seria forjável).
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).optional(),
  })
  .superRefine((dados, ctx) => {
    const erro = (campo: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [campo], message });

    if (dados.CORS_ORIGINS.includes("*")) {
      erro("CORS_ORIGINS", 'CORS_ORIGINS não pode conter "*".');
    }
    for (const origem of dados.CORS_ORIGINS) {
      if (origem !== "*" && !ehOrigemValida(origem)) {
        erro("CORS_ORIGINS", `Origem inválida: "${origem}". Use o formato https://dominio (sem barra no final).`);
      }
    }

    if (dados.NODE_ENV !== "production") return;

    // ---- Regras extras de produção ----
    if (dados.JWT_SECRET.length < JWT_MIN_PRODUCAO) {
      erro("JWT_SECRET", `Em produção, JWT_SECRET deve ter ao menos ${JWT_MIN_PRODUCAO} caracteres.`);
    }
    if (pareceValorDeExemplo(dados.JWT_SECRET)) {
      erro("JWT_SECRET", "JWT_SECRET parece um valor de exemplo. Gere um segredo aleatório.");
    }
    if (pareceValorDeExemplo(dados.DATABASE_URL)) {
      erro("DATABASE_URL", "DATABASE_URL usa uma senha de exemplo/desenvolvimento.");
    }
    if (dados.CORS_ORIGINS.length === 0) {
      erro("CORS_ORIGINS", "Em produção, CORS_ORIGINS é obrigatória (URL do frontend).");
    }
    for (const origem of dados.CORS_ORIGINS) {
      if (ehOrigemValida(origem) && !ehOrigemDeProducao(origem)) {
        erro("CORS_ORIGINS", `Em produção, a origem "${origem}" deve usar https:// e não pode ser localhost.`);
      }
    }
  })
  .transform((dados) => ({
    ...dados,
    CORS_ORIGINS: dados.CORS_ORIGINS.length > 0 ? dados.CORS_ORIGINS : ["http://localhost:5173"],
    TRUST_PROXY: dados.TRUST_PROXY ?? (dados.NODE_ENV === "production" ? 1 : 0),
  }));

export type Env = z.infer<typeof envSchema>;

export type ResultadoEnv =
  | { sucesso: true; env: Env }
  | { sucesso: false; erros: Record<string, string[]> };

/** Valida um conjunto de variáveis (função pura — não lê nem encerra o processo). */
export function validarEnv(origem: Record<string, string | undefined>): ResultadoEnv {
  const parsed = envSchema.safeParse(origem);
  if (parsed.success) return { sucesso: true, env: parsed.data };
  return { sucesso: false, erros: parsed.error.flatten().fieldErrors as Record<string, string[]> };
}

/** Valida e devolve o ambiente; em caso de erro, loga os campos e encerra o processo. */
export function carregarEnv(origem: Record<string, string | undefined> = process.env): Env {
  const resultado = validarEnv(origem);
  if (!resultado.sucesso) {
    // Só nomes de campos e mensagens — nunca os valores (podem ser segredos).
    console.error("❌ Variáveis de ambiente inválidas:", resultado.erros);
    return process.exit(1);
  }
  return resultado.env;
}

export const env = carregarEnv();
