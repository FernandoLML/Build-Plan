// Caminho: /frontend/src/types/compras.ts
// Contratos da Lista de Compras / Itens de Compra (espelham a API real — M4 Fase 2).

import { z } from "zod";

export type OrigemPreco = "SINAPI" | "MANUAL" | "PENDENTE";

export interface ItemCompra {
  id: string;
  listaComprasId: string;
  materialId: string | null;
  descricao: string;
  unidade: string;
  quantidade: string; // Decimal serializado
  precoUnitario: string | null; // Decimal | null
  precoTotal: string | null; // Decimal | null (congelado)
  origemPreco: string | null; // "SINAPI" | "MANUAL" | "PENDENTE"
  createdAt: string;
}

export interface TotaisLista {
  totalItens: number;
  itensSemPreco: number;
  totalOrcado: string; // Decimal com 2 casas
}

export interface ListaCompras {
  id: string;
  obraId: string;
  etapaId: string | null;
  geradaEm: string;
  itens: ItemCompra[];
  totais: TotaisLista;
}

// "Informar preço" (PATCH /itens-compra/:id)
export const informarPrecoSchema = z.object({
  precoUnitario: z.coerce.number().nonnegative("O preço não pode ser negativo."),
});
export type InformarPrecoValues = z.infer<typeof informarPrecoSchema>;

export interface AtualizarItemPayload {
  precoUnitario?: number;
  quantidade?: number;
  descricao?: string;
  unidade?: string;
}