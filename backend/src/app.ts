// Caminho: /backend/src/app.ts
// Monta e configura a aplicação Express SEM iniciar o listen.
// Isso permite que o Supertest importe `app` diretamente nos testes.

import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthController } from "./controllers/health.controller.js";
import { authRoutes } from "./routes/auth.routes.js";
import { obraRoutes } from "./routes/obra.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp(): Application {
  const app = express();

  // Middlewares globais
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Rotas públicas
  app.get("/", (_req: Request, res: Response) => {
    res.json({ message: "Build-Plan API online" });
  });
  app.get("/api/health", (req, res) => healthController.getHealth(req, res));

  // Autenticação
  app.use("/api/auth", authRoutes);

  // Rotas protegidas (authMiddleware aplicado dentro de obra.routes.ts)
  app.use("/api/obras", obraRoutes);

  // Tratamento de erro — SEMPRE por último.
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();