// Caminho: /backend/src/modules/sinapi/sinapi.parser.ts
// Parser da planilha oficial do SINAPI (Caixa). Lê a aba de insumos, detecta as
// colunas DINAMICAMENTE pelo texto do cabeçalho (resiliente a pequenas mudanças
// de layout entre competências) e extrai o preço mediano de uma UF específica.

import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { normalizarCodigoSinapi } from "./sinapi.codigo.js";

export type RegimeSinapi = "DESONERADO" | "NAO_DESONERADO";
export type TipoSinapi = "INSUMO" | "COMPOSICAO";

export interface RegistroSinapi {
  codigo: string;
  codigoNormalizado: string; // para correspondência com Material.codigoSinapi
  descricao: string;
  unidade: string;
  precoMediano: number;
  uf: string;
  mesReferencia: number;
  anoReferencia: number;
  regime: RegimeSinapi;
  tipo: TipoSinapi;
}

export interface OpcoesParser {
  uf: string; // coluna de preço a extrair (ex.: "SC")
  mesReferencia: number;
  anoReferencia: number;
  regime: RegimeSinapi;
  aba?: string; // default "ISD (2)"
  linhaCabecalho?: number; // 1-based, default 10
  tipo?: TipoSinapi; // default "INSUMO"
}

const normaliza = (s: unknown): string =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const paraNumero = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export function parsePlanilhaSinapi(caminho: string, opts: OpcoesParser): RegistroSinapi[] {
  const aba = opts.aba ?? "ISD (2)";
  const linhaCabecalho = opts.linhaCabecalho ?? 10;
  const tipo = opts.tipo ?? "INSUMO";
  const ufAlvo = normaliza(opts.uf);

  const wb = XLSX.read(readFileSync(caminho), { type: "buffer" });
  const ws = wb.Sheets[aba];
  if (!ws) {
    throw new Error(`Aba "${aba}" não encontrada. Abas: ${wb.SheetNames.join(", ")}`);
  }

  // header:1 → matriz de linhas; defval:null preserva colunas vazias e posições.
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

  const header = (matriz[linhaCabecalho - 1] ?? []).map(normaliza);
  const col = {
    codigo: header.indexOf("CODIGO DO INSUMO"),
    descricao: header.indexOf("DESCRICAO DO INSUMO"),
    unidade: header.indexOf("UNIDADE"),
    preco: header.indexOf(ufAlvo),
  };

  const faltando = Object.entries(col)
    .filter(([, i]) => i < 0)
    .map(([k]) => k);
  if (faltando.length > 0) {
    throw new Error(
      `Colunas não localizadas no cabeçalho (linha ${linhaCabecalho}): ${faltando.join(", ")}. ` +
        `Verifique a aba/linha de cabeçalho e a UF "${opts.uf}".`,
    );
  }

  const registros: RegistroSinapi[] = [];
  for (let i = linhaCabecalho; i < matriz.length; i++) {
    const row = matriz[i];
    if (!row) continue;

    const codBruto = row[col.codigo];
    if (codBruto === null || codBruto === undefined || codBruto === "") continue;

    const preco = paraNumero(row[col.preco]);
    if (preco === null || preco <= 0) continue; // sem preço mediano válido p/ a UF

    const descricao = String(row[col.descricao] ?? "").trim();
    const unidade = String(row[col.unidade] ?? "").trim();
    if (!descricao || !unidade) continue;

    const codigo = String(codBruto).trim();

    registros.push({
      codigo,
      codigoNormalizado: normalizarCodigoSinapi(codigo) ?? codigo,
      descricao,
      unidade,
      precoMediano: preco,
      uf: opts.uf.toUpperCase(),
      mesReferencia: opts.mesReferencia,
      anoReferencia: opts.anoReferencia,
      regime: opts.regime,
      tipo,
    });
  }

  return registros;
}