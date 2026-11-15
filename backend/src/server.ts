// Caminho: /backend/src/server.ts
// Ponto de entrada de produção/desenvolvimento — apenas inicia o servidor HTTP.
// A configuração da aplicação vive em app.ts (reutilizada pelos testes).

import { env } from "./config/env.js";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`Build-Plan API rodando em http://localhost:${env.PORT} (${env.NODE_ENV})`);
  console.log(`Health-check: http://localhost:${env.PORT}/api/health`);
});

// Encerramento gracioso (docker stop / systemd enviam SIGTERM): para de aceitar
// conexões, termina as requisições em andamento e fecha o pool do banco.
function encerrar(sinal: string): void {
  console.log(`[server] ${sinal} recebido, encerrando…`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  });
  // Se alguma conexão ficar presa, força a saída.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => encerrar("SIGTERM"));
process.on("SIGINT", () => encerrar("SIGINT"));
