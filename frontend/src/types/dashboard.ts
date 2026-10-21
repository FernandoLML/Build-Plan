// Caminho: /frontend/src/types/dashboard.ts
// Espelha a resposta real de GET /api/obras/:obraId/dashboard (M5 Workstream A).

export type StatusVinculo = "PREVISTO" | "RECEBIDO" | "APLICADO";

export interface ContagemPercentual {
  quantidade: number;
  percentual: number; // 0–100
}

export interface DashboardObra {
  obraId: string;
  etapas: { total: number };
  materiais: { total: number };
  vinculos: {
    total: number;
    porStatus: Record<StatusVinculo, ContagemPercentual>;
  };
  progressoTarefas: {
    total: number;
    concluidas: number;
    percentual: number;
  };
  orcamento: {
    totalOrcado: string; // Decimal serializado (ex.: "1250.00")
    itensSemPreco: number;
  };
}