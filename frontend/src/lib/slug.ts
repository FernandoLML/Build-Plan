// Caminho: /frontend/src/lib/slug.ts
// Nomes de arquivo seguros a partir de textos livres (mesma regra do backend:
// backend/src/services/export/lista-compras.dados.ts).

/** "Fundação & Estrutura" -> "fundacao-estrutura". */
export function slugificar(texto: string): string {
  const slug = texto
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "") // remove os acentos separados pelo NFD
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-") // sequências viram um único "-"
    .replace(/^-/, "")
    .replace(/-$/, "");
  return slug || "lista";
}

/** lista-compras-<etapa>.<extensao> */
export function nomeArquivoListaCompras(etapaNome: string, extensao: "xlsx" | "pdf" | "csv"): string {
  return `lista-compras-${slugificar(etapaNome)}.${extensao}`;
}
