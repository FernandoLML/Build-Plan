// Caminho: /frontend/src/types/sinapi.ts
// Contratos do catálogo SINAPI (espelham a tabela ItemSinapi do backend).
// Valores Decimal (precoMediano) chegam serializados como string.

export type RegimeSinapi = "DESONERADO" | "NAO_DESONERADO";
export type TipoSinapi = "INSUMO" | "COMPOSICAO";

export interface ItemSinapi {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  precoMediano: string; // Decimal serializado
  uf: string;
  mesReferencia: number;
  anoReferencia: number;
  regime: RegimeSinapi;
  tipo: TipoSinapi;
}

export interface BuscarSinapiParams {
  q: string;
  uf?: string;
  regime?: RegimeSinapi;
  limit?: number;
}