// Caminho: /frontend/src/types/rastreabilidade.ts
// Tipos da rastreabilidade: log de auditoria e máquina de estados RN01.

import { z } from "zod";
import type { StatusVinculo } from "@/types/material";

export interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
}

export interface LogRastreabilidade {
  id: string;
  vinculoId: string;
  usuarioId: string;
  statusAnterior: StatusVinculo | null;
  statusNovo: StatusVinculo;
  detalhes: string | null;
  criadoEm: string;
  usuario: UsuarioResumo;
}

// Observação opcional registrada na transição.
export const mudarStatusSchema = z.object({
  detalhes: z.string().trim().max(500).optional(),
});
export type MudarStatusValues = z.infer<typeof mudarStatusSchema>;

export interface AtualizarStatusPayload {
  status: StatusVinculo;
  detalhes?: string;
}

// Máquina de estados RN01: avança um passo por vez.
export const PROXIMO_STATUS: Record<StatusVinculo, StatusVinculo | null> = {
  PREVISTO: "RECEBIDO",
  RECEBIDO: "APLICADO",
  APLICADO: null,
};

export const STATUS_LABEL: Record<StatusVinculo, string> = {
  PREVISTO: "Previsto",
  RECEBIDO: "Recebido",
  APLICADO: "Aplicado",
};