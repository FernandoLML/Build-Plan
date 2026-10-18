// Caminho: /frontend/src/types/memorial.ts
// Contratos do UC01 (importação do memorial) — espelham a API real do backend.
// Observação: o backend é TABULAR (CSV texto / JSON), não multipart nem PDF.

export interface ItemMemorial {
  nome: string;
  especificacao?: string;
  unidade: string;
  quantidade: number;
  codigoSinapi?: string;
}

// Linha do CSV que não passou na validação, com o motivo (vindo do backend).
export interface LinhaRejeitada {
  linha: number;
  conteudo: string;
  motivo: string;
}

// Resposta de POST /obras/:obraId/materiais/preview-memorial
export interface PreviewMemorialResponse {
  itens: ItemMemorial[];
  rejeitados: LinhaRejeitada[];
  totalLinhas: number;
}

// Resposta de POST /obras/:obraId/materiais/importar-memorial
export interface ImportarMemorialResponse {
  importados: number;
}