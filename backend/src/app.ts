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

  // Tratamento de erro — SEMPRE por último, após todas as rotas.
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();