// Caminho: /frontend/src/lib/download.ts
// Dispara downloads no navegador: conteúdo textual (ex.: CSV) ou binário
// recebido da API (ex.: .xlsx/.pdf com responseType "blob").

export function baixarArquivo(
  nomeArquivo: string,
  conteudo: string,
  mime = "text/csv;charset=utf-8",
): void {
  baixarBlob(nomeArquivo, new Blob([conteudo], { type: mime }));
}

export function baixarBlob(nomeArquivo: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}