// Caminho: /backend/src/tests/helpers/test-db.ts
// Utilitários de banco para os testes de integração.

import { prisma } from "../../lib/prisma.js";

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