// Caminho: /backend/src/services/export/marca.ts
// Identidade visual dos documentos exportados (mesma paleta do frontend).
// A logo é o ícone "Boxes" (lucide, licença ISC) em branco sobre um quadrado
// índigo, exatamente como em frontend/public/favicon.svg e no menu lateral.
//
// Há duas paletas com os mesmos papéis: a colorida (padrão) e a preto e
// branco, pensada para impressoras sem cor ou com pouca tinta. Na P&B os
// textos ficam mais escuros e os destaques viram tons de cinza bem distintos,
// para nada sair "apagado" na impressão.

/** Papel de cada cor no documento (o gerador nunca usa um hexadecimal solto). */
export interface PaletaExportacao {
  /** Logo, título "Lista de Compras", linhas de destaque e valor total. */
  destaque: string;
  /** Fundo do cabeçalho da tabela e da linha de total. */
  destaqueClaro: string;
  /** Texto sobre o fundo de destaque (faixa de título do Excel, ícone da logo). */
  textoSobreDestaque: string;
  texto: string;
  textoSecundario: string;
  /** Traço "—" de valor ausente e rodapé. */
  textoApagado: string;
  borda: string;
  /** Linhas alternadas (zebra) e cartões de resumo. */
  fundoAlternado: string;
  /** Texto de itens sem preço (PENDENTE). */
  alerta: string;
  /** Fundo das linhas sem preço (PENDENTE). */
  alertaClaro: string;
  /** Valor do Total Orçado no resumo. */
  positivo: string;
  /** Texto da legenda que explica o destaque das linhas pendentes. */
  nomeDestaquePendente: string;
}

export const PALETA_COLORIDA: PaletaExportacao = {
  destaque: "#4F46E5", // índigo
  destaqueClaro: "#EEF2FF",
  textoSobreDestaque: "#FFFFFF",
  texto: "#0F172A", // ardósia 900
  textoSecundario: "#475569", // ardósia 600
  textoApagado: "#94A3B8", // ardósia 400
  borda: "#E2E8F0", // ardósia 200
  fundoAlternado: "#F8FAFC", // ardósia 50
  alerta: "#92400E", // âmbar 800
  alertaClaro: "#FEF3C7",
  positivo: "#047857", // esmeralda 700
  nomeDestaquePendente: "em amarelo",
};

export const PALETA_PRETO_E_BRANCO: PaletaExportacao = {
  destaque: "#000000",
  destaqueClaro: "#E0E0E0",
  textoSobreDestaque: "#FFFFFF",
  texto: "#000000",
  textoSecundario: "#262626",
  textoApagado: "#4D4D4D",
  borda: "#808080", // bordas visíveis mesmo em impressão clara
  fundoAlternado: "#F2F2F2",
  alerta: "#000000",
  alertaClaro: "#C4C4C4", // bem mais escuro que a zebra, para destacar os pendentes
  positivo: "#000000",
  nomeDestaquePendente: "em cinza",
};

export type TemaExportacao = "cor" | "pb";

export function paletaDoTema(tema: TemaExportacao): PaletaExportacao {
  return tema === "pb" ? PALETA_PRETO_E_BRANCO : PALETA_COLORIDA;
}

/** Paths SVG (viewBox 24x24, traço 2, pontas arredondadas) do ícone da logo. */
export const LOGO_PATHS: readonly string[] = [
  "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z",
  "m7 16.5-4.74-2.85",
  "m7 16.5 5-3",
  "M7 16.5v5.17",
  "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z",
  "m17 16.5-5-3",
  "m17 16.5 4.74-2.85",
  "M17 16.5v5.17",
  "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z",
  "M12 8 7.26 5.15",
  "m12 8 4.74-2.85",
  "M12 13.5V8",
];

/** ARGB (formato do exceljs) a partir de "#RRGGBB". */
export function argb(hex: string): string {
  return `FF${hex.replace("#", "").toUpperCase()}`;
}
