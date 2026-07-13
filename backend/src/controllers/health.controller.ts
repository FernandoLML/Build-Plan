// Caminho: /backend/src/controllers/health.controller.ts
// Controller de teste — recebe a requisição e delega ao service.

import { Request, Response } from "express";
import { healthService } from "../services/health.service.js";

export class HealthController {
  public getHealth(_req: Request, res: Response): Response {
    const result = healthService.check();
    return res.status(200).json(result);
  }
}

export const healthController = new HealthController();