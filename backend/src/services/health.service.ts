// Caminho: /backend/src/services/health.service.ts
// Service de teste — camada de lógica de negócio.

export interface HealthStatus {
  status: "ok";
  service: string;
  timestamp: string;
  uptimeSeconds: number;
}

export class HealthService {
  /**
   * Retorna o estado de saúde da API.
   * Útil para verificar se o tsx/ts-node está executando o código corretamente.
   */
  public check(): HealthStatus {
    return {
      status: "ok",
      service: "build-plan-api",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}

export const healthService = new HealthService();