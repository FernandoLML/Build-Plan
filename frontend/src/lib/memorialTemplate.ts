// Caminho: /frontend/src/lib/memorialTemplate.ts
// Template CSV do Memorial Descritivo (UC01), gerado no cliente.
// Cabeçalho alinhado aos sinônimos do parser (backend/src/services/memorial.service.ts):
//   Nome → nome | Especificacao → especificacao | Unidade → unidade |
//   Quantidade → quantidade | Codigo SINAPI → codigosinapi
// Delimitador ";" e números no formato pt-BR (vírgula decimal), aceitos pelo parser.

import { baixarArquivo } from "./download";

export const TEMPLATE_MEMORIAL_NOME = "template-memorial.csv";

/** BOM UTF-8: garante acentuação correta ao abrir o arquivo no Excel. */
export const UTF8_BOM = "﻿";

export const TEMPLATE_MEMORIAL_CABECALHO = ["Nome", "Especificacao", "Unidade", "Quantidade", "Codigo SINAPI"];

export const TEMPLATE_MEMORIAL_LINHAS: string[][] = [
  ["Cimento Portland CP II-32", "Saco de 50 kg", "KG", "2500", "00001379"],
  ["Areia média", "Lavada, posto jazida", "M3", "12,5", "00000370"],
  ["Pedra britada nº 1", "9,5 a 19 mm, posto pedreira", "M3", "8", "00004721"],
];

/** Conteúdo completo do template (com BOM, ";" como delimitador e CRLF). */
export function gerarTemplateMemorialCsv(): string {
  const linhas = [TEMPLATE_MEMORIAL_CABECALHO, ...TEMPLATE_MEMORIAL_LINHAS].map((l) => l.join(";"));
  return UTF8_BOM + linhas.join("\r\n") + "\r\n";
}

export function baixarTemplateMemorial(): void {
  baixarArquivo(TEMPLATE_MEMORIAL_NOME, gerarTemplateMemorialCsv());
}
