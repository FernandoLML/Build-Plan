// Caminho: /backend/src/tests/helpers/test-db.ts
// Utilitários de banco para os testes de integração.

import { prisma } from "../../lib/prisma.js";

/**
 * Trava de segurança: os testes apagam tabelas inteiras (TRUNCATE/deleteMany).
 * Só prossegue se o DATABASE_URL apontar claramente para um banco de teste
 * (nome do banco ou schema contendo "test"). Evita apagar o banco de
 * desenvolvimento ao rodar a suíte sem o .env.test (ex.: `npm run test:ci`
 * localmente, que carrega o .env via dotenv/config).
 */
export function garantirBancoDeTeste(databaseUrl = process.env.DATABASE_URL): void {
  let alvo: string;
  try {
    const url = new URL(databaseUrl ?? "");
    alvo = `${url.pathname} ${url.searchParams.get("schema") ?? ""}`.toLowerCase();
  } catch {
    alvo = "";
  }
  if (!alvo.includes("test")) {
    throw new Error(
      "Testes abortados: DATABASE_URL não aponta para um banco/schema de teste. " +
        "Use `npm test` (carrega o .env.test) ou defina um DATABASE_URL de teste.",
    );
  }
}

/**
 * Limpa todas as tabelas na ordem correta de dependência (FK).
 * Usa TRUNCATE ... RESTART IDENTITY CASCADE para performance e reset total.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "log_rastreabilidade",
      "item_compra",
      "lista_compras",
      "vinculo_material_etapa",
      "material",
      "tarefa",
      "etapa",
      "obra",
      "usuario"
    RESTART IDENTITY CASCADE;
  `);
}

/** Encerra a conexão do Prisma ao final da suíte. */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}