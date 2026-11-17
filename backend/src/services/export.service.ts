// Caminho: /backend/src/services/export.service.ts
// Exportação de relatórios (M5 — Workstream B). Gera o CSV da lista de compras
// nativamente (sem dependências) e, na Etapa 4, as versões profissionais em
// .xlsx (exceljs) e .pdf (pdfkit). Todas validam o ownership da lista (404).

import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import {
  nomeArquivoExportacao,
  paraItemExportacao,
  type ListaComprasExportacao,
} from "./export/lista-compras.dados.js";
import { gerarXlsxListaCompras } from "./export/lista-compras.xlsx.js";
import { gerarPdfListaCompras } from "./export/lista-compras.pdf.js";
import { paletaDoTema, type TemaExportacao } from "./export/marca.js";

export interface ArquivoExportado {
  nomeArquivo: string;
  conteudo: Buffer;
}

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
    return `"${valor.replaceAll('"', '""')}"`;
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

  /**
   * Gera a planilha .xlsx estilizada da lista de compras (404 se não for do
   * usuário). `tema: "pb"` usa a paleta preto e branco, para impressão.
   */
  public async exportarListaComprasXlsx(
    listaId: string,
    usuarioId: string,
    tema: TemaExportacao = "cor",
  ): Promise<ArquivoExportado> {
    const dados = await this.carregarDadosExportacao(listaId, usuarioId);
    return {
      nomeArquivo: nomeArquivoExportacao(dados.etapaNome, "xlsx", tema),
      conteudo: await gerarXlsxListaCompras(dados, paletaDoTema(tema)),
    };
  }

  /** Gera o PDF da lista de compras (404 se não for do usuário), colorido ou P&B. */
  public async exportarListaComprasPdf(
    listaId: string,
    usuarioId: string,
    tema: TemaExportacao = "cor",
  ): Promise<ArquivoExportado> {
    const dados = await this.carregarDadosExportacao(listaId, usuarioId);
    return {
      nomeArquivo: nomeArquivoExportacao(dados.etapaNome, "pdf", tema),
      conteudo: await gerarPdfListaCompras(dados, paletaDoTema(tema)),
    };
  }

  /**
   * Carrega lista + obra + etapa e resolve o código SINAPI de cada item pelo
   * material de origem (uma única query extra, sem N+1).
   */
  private async carregarDadosExportacao(listaId: string, usuarioId: string): Promise<ListaComprasExportacao> {
    const lista = await prisma.listaCompras.findFirst({
      where: { id: listaId, obra: { usuarioId } },
      include: {
        obra: { select: { nome: true } },
        etapa: { select: { nome: true } },
        itens: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!lista) {
      throw new AppError("Lista de compras não encontrada.", 404);
    }

    const materialIds = [
      ...new Set(lista.itens.map((i) => i.materialId).filter((id): id is string => id !== null)),
    ];
    const materiais =
      materialIds.length > 0
        ? await prisma.material.findMany({
            where: { id: { in: materialIds }, obraId: lista.obraId },
            select: { id: true, codigoSinapi: true },
          })
        : [];
    const codigos = new Map(materiais.map((m) => [m.id, m.codigoSinapi]));

    return {
      obraNome: lista.obra.nome,
      etapaNome: lista.etapa?.nome ?? "Geral",
      geradaEm: lista.geradaEm,
      emitidaEm: new Date(),
      itens: lista.itens.map((item) => paraItemExportacao(item, codigos)),
    };
  }
}

export const exportService = new ExportService();