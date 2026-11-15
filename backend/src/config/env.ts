// Caminho: /backend/src/config/env.ts
// Centraliza e valida as variáveis de ambiente na inicialização.
// Falha rápido (fail-fast) se algo essencial estiver faltando.

import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter ao menos 16 caracteres."),
  JWT_EXPIRES_IN: z.string().default("8h"),
  // Origens autorizadas pelo CORS, separadas por vírgula. Nunca "*".
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((v) =>
      v
        .split(",")
        .map((o) => o.trim())
        .filter((o) => o.length > 0),
    )
    .refine((lista) => !lista.includes("*"), "CORS_ORIGINS não pode conter \"*\"."),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;