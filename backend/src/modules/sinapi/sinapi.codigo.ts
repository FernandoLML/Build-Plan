// Caminho: /backend/src/modules/sinapi/sinapi.codigo.ts
// Normalização única do código SINAPI — usada ao salvar o material (memorial) e
// ao resolver o preço, evitando falhas de correspondência silenciosas
// (ex.: "00000370" vs "370"). Remove espaços e zeros à esquerda de forma estável.

export function normalizarCodigoSinapi(codigo: string | null | undefined): string | null {
  if (codigo === null || codigo === undefined) return null;
  const limpo = String(codigo).trim();
  if (limpo.length === 0) return null;
  const semZeros = limpo.replace(/^0+/, "");
  return semZeros.length > 0 ? semZeros : limpo; // guarda o caso "todos zeros"
}