// Caminho: /backend/src/services/export/marca.ts
// Identidade visual dos documentos exportados (mesma paleta do frontend).
// A logo é o ícone "Boxes" (lucide, licença ISC) em branco sobre um quadrado
// índigo, exatamente como em frontend/public/favicon.svg e no menu lateral.

export const CORES = {
  indigo: "#4F46E5",
  indigoClaro: "#EEF2FF",
  ardosia900: "#0F172A",
  ardosia600: "#475569",
  ardosia400: "#94A3B8",
  ardosia200: "#E2E8F0",
  ardosia50: "#F8FAFC",
  ambar800: "#92400E",
  ambarClaro: "#FEF3C7",
  esmeralda700: "#047857",
} as const;

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
