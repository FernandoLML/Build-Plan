// Caminho: /backend/src/server.ts
// Ponto de entrada da API Build-Plan.

import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { healthController } from "./controllers/health.controller.js";
import { authRoutes } from "./routes/auth.routes.js";
import { obraRoutes } from "./routes/obra.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app: Application = express();

// Middlewares globais
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" })); // limite de payload (RNF de segurança)

// Rotas públicas
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Build-Plan API online" });
});
app.get("/api/health", (req, res) => healthController.getHealth(req, res));

// Autenticação (register/login públicos; me protegido internamente)
app.use("/api/auth", authRoutes);

// Rotas protegidas — o authMiddleware é aplicado dentro de obra.routes.ts,
// populando req.userId a partir do token JWT.
app.use("/api/obras", obraRoutes);

// Tratamento de erro — SEMPRE por último, após todas as rotas.
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  console.log(`Build-Plan API rodando em http://localhost:${env.PORT}`);
  console.log(`Health-check: http://localhost:${env.PORT}/api/health`);
});

export { app };