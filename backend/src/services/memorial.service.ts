// Caminho: /backend/src/services/memorial.service.ts
// UC01 — Extração assistida e importação a partir do Memorial Descritivo (M4 Fase 3).
// Faz o parsing tabular (CSV/JSON), sanitiza, valida com Zod e persiste os
// materiais com origem MEMORIAL atomicamente.

import { Prisma, OrigemMaterial } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { itemMemorialSchema } from "../schemas/memorial.schema.js";
import type { ItemMemorialInput } from "../schemas/memorial.schema.js";

export interface LinhaRejeitada {
  linha: number; // número da linha no arquivo (1-based, contando o cabeçalho)
  conteudo: string;
  motivo: string;
}

export interface ResultadoExtracao {
  itens: ItemMemorialInput[];
  rejeitados: LinhaRejeitada[];
  totalLinhas: number;
}

type CampoCanonico = "nome" | "especificacao" | "unidade" | "quantidade" | "codigoSinapi";

// Sinônimos aceitos de cabeçalho (normalizados: minúsculo, sem acento/pontuação).
const SINONIMOS: Record<CampoCanonico, string[]> = {
  nome: ["nome", "material", "descricao"],
  especificacao: ["especificacao", "espec", "detalhe", "detalhes"],
  unidade: ["unidade", "un", "und", "medida"],
  quantidade: ["quantidade", "qtd", "qtde", "quant"],
  codigoSinapi: ["sinapi", "codigosinapi", "codigo", "cod"],
};

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Divide uma linha respeitando aspas duplas (campos com o delimitador dentro).
function dividirLinha(linha: string, delimitador: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i += 1) {
    const char = linha[i];
    if (char === '"') {
      if (dentroAspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1; // aspas escapadas ("")
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (char === delimitador && !dentroAspas) {
      campos.push(atual);
      atual = "";
    } else {
      atual += char;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

// Converte quantidade textual (pt-BR ou en) em número. "1.234,5" -> 1234.5
function parseQuantidade(bruto: string): number {
  let s = bruto.trim();
  if (!s) return NaN;
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  return Number(s);
}

export class MemorialService {
  /** Garante que a obra existe e pertence ao usuário. Lança 404 caso contrário. */
  private async assertObraDoUsuario(obraId: string, usuarioId: string): Promise<void> {
    const obra = await prisma.obra.findFirst({
      where: { id: obraId, usuarioId },
      select: { id: true },
    });
    if (!obra) {
      throw new AppError("Obra não encontrada.", 404);
    }
  }

  /**
   * Faz o parsing de um texto CSV, aceitando delimitadores vírgula/ponto-e-vírgula/tab
   * e cabeçalhos flexíveis. Devolve os itens válidos e as linhas rejeitadas com motivo.
   */
  public parseMemorialCSV(conteudoCsv: string): ResultadoExtracao {
    if (!conteudoCsv || conteudoCsv.trim().length === 0) {
      throw new AppError("O conteúdo CSV está vazio.", 400);
    }

    const linhas = conteudoCsv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (linhas.length < 2) {
      throw new AppError(
        "CSV malformado: é necessário um cabeçalho e ao menos uma linha de dados.",
        400,
      );
    }

    // Detecta o delimitador pelo cabeçalho (maior ocorrência entre ; , e tab).
    const cabecalhoBruto = linhas[0];
    const candidatos = [";", ",", "\t"];
    const delimitador = candidatos.reduce((melhor, d) =>
      cabecalhoBruto.split(d).length > cabecalhoBruto.split(melhor).length ? d : melhor,
    );

    // Mapeia índice da coluna -> campo canônico.
    const cabecalhos = dividirLinha(cabecalhoBruto, delimitador).map(normalizar);
    const colunas: Partial<Record<CampoCanonico, number>> = {};
    cabecalhos.forEach((h, idx) => {
      (Object.keys(SINONIMOS) as CampoCanonico[]).forEach((campo) => {
        if (colunas[campo] === undefined && SINONIMOS[campo].includes(h)) {
          colunas[campo] = idx;
        }
      });
    });

    // Colunas obrigatórias.
    if (colunas.nome === undefined || colunas.unidade === undefined || colunas.quantidade === undefined) {
      throw new AppError(
        "CSV malformado: o cabeçalho deve conter colunas para nome, unidade e quantidade.",
        400,
      );
    }

    const itens: ItemMemorialInput[] = [];
    const rejeitados: LinhaRejeitada[] = [];

    for (let i = 1; i < linhas.length; i += 1) {
      const conteudo = linhas[i];
      const celulas = dividirLinha(conteudo, delimitador);
      const pegar = (campo: CampoCanonico): string | undefined => {
        const idx = colunas[campo];
        if (idx === undefined) return undefined;
        const valor = celulas[idx]?.trim();
        return valor && valor.length > 0 ? valor : undefined;
      };

      const candidato = {
        nome: pegar("nome"),
        especificacao: pegar("especificacao"),
        unidade: pegar("unidade"),
        quantidade: colunas.quantidade !== undefined ? parseQuantidade(celulas[colunas.quantidade] ?? "") : NaN,
        codigoSinapi: pegar("codigoSinapi"),
      };

      const parsed = itemMemorialSchema.safeParse(candidato);
      if (parsed.success) {
        itens.push(parsed.data);
      } else {
        rejeitados.push({
          linha: i + 1, // 1-based incluindo o cabeçalho
          conteudo,
          motivo: parsed.error.issues.map((it) => it.message).join("; "),
        });
      }
    }

    return { itens, rejeitados, totalLinhas: linhas.length - 1 };
  }

  /** Valida uma lista JSON prévia item a item, separando válidos e rejeitados. */
  public validarItensJson(lista: Record<string, unknown>[]): ResultadoExtracao {
    const itens: ItemMemorialInput[] = [];
    const rejeitados: LinhaRejeitada[] = [];

    lista.forEach((bruto, idx) => {
      // Converte quantidade textual eventualmente recebida como string.
      const candidato = {
        ...bruto,
        quantidade:
          typeof bruto.quantidade === "string"
            ? parseQuantidade(bruto.quantidade)
            : bruto.quantidade,
      };
      const parsed = itemMemorialSchema.safeParse(candidato);
      if (parsed.success) {
        itens.push(parsed.data);
      } else {
        rejeitados.push({
          linha: idx + 1,
          conteudo: JSON.stringify(bruto),
          motivo: parsed.error.issues.map((it) => it.message).join("; "),
        });
      }
    });

    return { itens, rejeitados, totalLinhas: lista.length };
  }

  /** Pré-visualização (não persiste): valida ownership e devolve o resultado da extração. */
  public async preview(
    obraId: string,
    usuarioId: string,
    input: { csv?: string; itens?: Record<string, unknown>[] },
  ): Promise<ResultadoExtracao> {
    await this.assertObraDoUsuario(obraId, usuarioId);

    if (typeof input.csv === "string" && input.csv.trim().length > 0) {
      return this.parseMemorialCSV(input.csv);
    }
    if (Array.isArray(input.itens) && input.itens.length > 0) {
      return this.validarItensJson(input.itens);
    }
    throw new AppError("Nenhum conteúdo válido para pré-visualizar.", 400);
  }

  /**
   * Importa os itens já revisados, persistindo os materiais com origem MEMORIAL
   * e quantidades como Prisma.Decimal, tudo numa única transação.
   */
  public async importarMemorial(
    obraId: string,
    usuarioId: string,
    itens: ItemMemorialInput[],
  ) {
    await this.assertObraDoUsuario(obraId, usuarioId);

    if (itens.length === 0) {
      throw new AppError("Nenhum item para importar.", 400);
    }

    const materiais = await prisma.$transaction(
      itens.map((item) =>
        prisma.material.create({
          data: {
            nome: item.nome,
            especificacao: item.especificacao,
            unidade: item.unidade,
            quantidade: new Prisma.Decimal(item.quantidade),
            origem: OrigemMaterial.MEMORIAL,
            codigoSinapi: item.codigoSinapi,
            obraId,
          },
        }),
      ),
    );

    return { importados: materiais.length, materiais };
  }
}

export const memorialService = new MemorialService();