// Caminho: /backend/src/lib/prisma.ts
// Instância única (singleton) do Prisma Client, reutilizada em toda a aplicação.
// Evita esgotar o pool de conexões durante o hot-reload do tsx watch.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}