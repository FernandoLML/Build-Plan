// Caminho: /backend/src/server.ts
// Ponto de entrada de produção/desenvolvimento — apenas inicia o servidor HTTP.
// A configuração da aplicação vive em app.ts (reutilizada pelos testes).

import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.PORT, () => {
  console.log(`Build-Plan API rodando em http://localhost:${env.PORT}`);
  console.log(`Health-check: http://localhost:${env.PORT}/api/health`);
});