// Caminho: /backend/src/app.ts
// Monta e configura a aplicação Express SEM iniciar o listen.
// Isso permite que o Supertest importe `app` diretamente nos testes.

import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthController } from "./controllers/health.controller.js";
import { authRoutes } from "./routes/auth.routes.js";
import { obraRoutes } from "./routes/obra.routes.js";
import { etapaRoutes } from "./routes/etapa.routes.js";
import { tarefaRoutes } from "./routes/tarefa.routes.js";
import { materialRoutes } from "./routes/material.routes.js";
import { vinculoRoutes } from "./routes/vinculo.routes.js";
import { listaRoutes } from "./routes/lista-compras.routes.js";
import { itemRoutes } from "./routes/item-compra.routes.js";
import { sinapiRouter } from "./modules/sinapi/sinapi.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { criarLimitadores, type LimitesRateLimit } from "./middlewares/rate-limit.middleware.js";
import { env } from "./config/env.js";

export interface AppOptions {
  /** Liga o rate limiting. Default: ligado, exceto em NODE_ENV=test. */
  rateLimit?: boolean;
  /** Sobrescreve os limites padrão (usado nos testes). */
  limites?: LimitesRateLimit;
  /** Nº de proxies confiáveis (X-Forwarded-For). Default: env.TRUST_PROXY. */
  trustProxy?: number;
}

export function createApp(opcoes: AppOptions = {}): Application {
  const app = express();
  const rateLimitAtivo = opcoes.rateLimit ?? env.NODE_ENV !== "test";

  // Atrás do Nginx (EC2), o IP real do cliente chega em X-Forwarded-For. Só
  // confiamos em N saltos (1 = o Nginx); com 0 o header é ignorado, evitando
  // que um cliente forje o IP para escapar do rate limit quando não há proxy.
  app.set("trust proxy", opcoes.trustProxy ?? env.TRUST_PROXY);

  // Headers de segurança HTTP. A API só devolve JSON e arquivos para download,
  // então a CSP bloqueia tudo (nada aqui deve ser renderizado como página).
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      // O frontend fica em outra origem (Vercel): as respostas precisam poder
      // ser lidas cross-origin. Quem decide QUAIS origens é o CORS abaixo.
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // HSTS só tem efeito sobre HTTPS (terminado no Nginx); 1 ano.
      strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  // CORS restrito a uma allowlist explícita (CORS_ORIGINS), em vez de "*".
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      // Permite ao frontend ler o nome do arquivo e o tempo de espera do 429.
      exposedHeaders: ["Content-Disposition", "Retry-After"],
    }),
  );

  // Rate limiting (depois do CORS, para o 429 também sair com os headers de
  // CORS; antes dos parsers, para rejeitar sem ler o corpo).
  if (rateLimitAtivo) {
    const limitadores = criarLimitadores(opcoes.limites);
    app.use("/api", limitadores.geral);
    app.use("/api/auth/login", limitadores.login);
    app.use("/api/auth/register", limitadores.cadastro);
  }

  app.use(express.json({ limit: "1mb" }));
  // UC01: aceita o Memorial Descritivo colado como texto cru (CSV).
  app.use(express.text({ type: ["text/csv", "text/plain"], limit: "2mb" }));

  // Rotas públicas
  app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "Build-Plan API online" });
  });
  app.get("/api/health", (req, res) => healthController.getHealth(req, res));

  // Autenticação
  app.use("/api/auth", authRoutes);

  // Rotas protegidas (authMiddleware aplicado dentro de cada router).
  // As rotas aninhadas (materiais, vínculos, lista de compras) são montadas
  // dentro de obra.routes.ts e etapa.routes.ts.
  app.use("/api/obras", obraRoutes);
  app.use("/api/etapas", etapaRoutes);
  app.use("/api/tarefas", tarefaRoutes);
  app.use("/api/materiais", materialRoutes);
  app.use("/api/vinculos", vinculoRoutes);
  app.use("/api/listas-compras", listaRoutes);
  app.use("/api/itens-compra", itemRoutes);
  app.use("/api/sinapi", sinapiRouter);

  // Tratamento de erro — SEMPRE por último, após todas as rotas.
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();