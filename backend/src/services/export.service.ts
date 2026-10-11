// Caminho: /backend/src/services/export.service.ts
// Exportação de relatórios (M5 — Workstream B). Gera o CSV da lista de compras
// nativamente (sem dependências), validando ownership da lista.

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";

// Item com os campos necessários ao CSV (Decimais expõem toString()).
interface ItemCsv {
  descricao: string;
  unidade: string;
  quantidade: { toString(): string };
  precoUnitario: { toString(): string } | null;
  precoTotal: { toString(): string } | null;
  origemPreco: string | null;
}

const CABECALHO = [
  "Descricao",
  "Unidade",
  "Quantidade",
  "Preco Unitario",
  "Preco Total",
  "Origem Preco",
];

// Escapa um campo CSV: envolve em aspas se contiver vírgula, aspas ou quebra de linha.
function escaparCampo(valor: string): string {
  if (/[",\r\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function montarCsv(itens: ItemCsv[]): string {
  const linhas = [CABECALHO.join(",")];

  for (const item of itens) {
    const colunas = [
      item.descricao,
      item.unidade,
      item.quantidade.toString(),
      item.precoUnitario !== null ? item.precoUnitario.toString() : "",
      item.precoTotal !== null ? item.precoTotal.toString() : "",
      item.origemPreco ?? "",
    ];
    linhas.push(colunas.map((c) => escaparCampo(c)).join(","));
  }

  // CRLF é o fim de linha padrão de CSV (RFC 4180).
  return linhas.join("\r\n");
}

export class ExportService {
  /** Gera a string CSV da lista de compras, validando ownership (404). */
  public async exportarListaComprasCsv(listaId: string, usuarioId: string): Promise<string> {
    const lista = await prisma.listaCompras.findFirst({
      where: { id: listaId, obra: { usuarioId } },
      include: { itens: { orderBy: { createdAt: "asc" } } },
    });

    if (!lista) {
      throw new AppError("Lista de compras não encontrada.", 404);
    }

    return montarCsv(lista.itens);
  }
}

export const exportService = new ExportService();