// Caminho: /backend/src/server.ts
// Ponto de entrada da API Build-Plan.

import "dotenv/config";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthController } from "./controllers/health.controller.js";

const app: Application = express();
const PORT = Number(process.env.PORT) || 3333;

// Middlewares globais
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" })); // limite de payload (RNF de segurança)

// Rota raiz
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Build-Plan API online" });
});

// Rota de health-check (controller -> service de teste)
app.get("/api/health", (req, res) => healthController.getHealth(req, res));

app.listen(PORT, () => {
  console.log(`Build-Plan API rodando em http://localhost:${PORT}`);
  console.log(`Health-check: http://localhost:${PORT}/api/health`);
});

export { app };