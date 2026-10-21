// Caminho: /frontend/src/lib/download.ts
// Dispara o download de um conteúdo textual (ex.: CSV) no navegador.

export function baixarArquivo(
  nomeArquivo: string,
  conteudo: string,
  mime = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}