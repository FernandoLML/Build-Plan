// Caminho: /backend/src/services/lista-compras.service.ts
// Regra de negócio das Listas de Compras (M4 — Fase 2).
// A lista é um SNAPSHOT (Seção 5.2): gerada sob demanda a partir dos vínculos
// material-etapa, congelando os preços em ItemCompra no momento da geração.
// Branch 1 (auto-pricing): o preço de referência vem do catálogo SINAPI.

import { OrigemPreco, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import { sinapiConfig } from "../config/sinapi.config.js";
import { normalizarCodigoSinapi } from "../modules/sinapi/sinapi.codigo.js";

export interface TotaisLista {
  totalItens: number;
  itensSemPreco: number;
  totalOrcado: string; // Decimal serializado com 2 casas
}

export class ListaComprasService {
  /** Garante que a etapa existe e pertence ao usuário. Retorna id + obraId. */
  private async assertEtapaDoUsuario(
    etapaId: string,
    usuarioId: string,
  ): Promise<{ id: string; obraId: string }> {
    const etapa = await prisma.etapa.findFirst({
      where: { id: etapaId, obra: { usuarioId } },
      select: { id: true, obraId: true },
    });
    if (!etapa) {
      throw new AppError("Etapa não encontrada.", 404);
    }
    return etapa;
  }

  /** Busca uma lista garantindo que a obra pertence ao usuário. */
  private async buscarListaDoUsuario(listaId: string, usuarioId: string) {
    const lista = await prisma.listaCompras.findFirst({
      where: { id: listaId, obra: { usuarioId } },
      include: { itens: true },
    });
    if (!lista) {
      throw new AppError("Lista de compras não encontrada.", 404);
    }
    return lista;
  }

  /**
   * Preços de referência dos insumos no momento da geração (snapshot).
   * Consulta o catálogo SINAPI pela competência/UF padrão (sinapiConfig) em UMA
   * única query (`codigoNormalizado IN (...)`), evitando N+1. O casamento usa o
   * código NORMALIZADO (trim + zeros à esquerda), para evitar divergências como
   * "00000370" vs "370". Retorna um Map codigoNormalizado -> precoMediano.
   */
  private async resolverPrecosReferencia(
    codigosSinapi: ReadonlyArray<string | null>,
  ): Promise<Map<string, Prisma.Decimal>> {
    const codigos = [
      ...new Set(
        codigosSinapi
          .map((codigo) => normalizarCodigoSinapi(codigo))
          .filter((codigo): codigo is string => codigo !== null),
      ),
    ];
    if (codigos.length === 0) return new Map();

    const itens = await prisma.itemSinapi.findMany({
      where: {
        codigoNormalizado: { in: codigos },
        uf: sinapiConfig.uf,
        mesReferencia: sinapiConfig.mesReferencia,
        anoReferencia: sinapiConfig.anoReferencia,
        regime: sinapiConfig.regime,
      },
      select: { codigoNormalizado: true, precoMediano: true },
    });

    return new Map(itens.map((item) => [item.codigoNormalizado, item.precoMediano]));
  }

  /**
   * Gera uma nova lista de compras (snapshot) a partir dos vínculos da etapa.
   * Persiste a lista e seus itens atomicamente via prisma.$transaction.
   */
  public async gerarPorEtapa(etapaId: string, usuarioId: string) {
    const etapa = await this.assertEtapaDoUsuario(etapaId, usuarioId);

    const vinculos = await prisma.vinculoMaterialEtapa.findMany({
      where: { etapaId },
      include: {
        material: { select: { id: true, nome: true, unidade: true, codigoSinapi: true } },
      },
    });

    if (vinculos.length === 0) {
      throw new AppError(
        "Não há materiais vinculados a esta etapa para gerar a lista de compras.",
        400,
      );
    }

    // Resolve todos os preços de referência numa única consulta ao catálogo
    // e monta os itens congelando o preço (snapshot) no momento da geração.
    const precos = await this.resolverPrecosReferencia(
      vinculos.map((vinculo) => vinculo.material.codigoSinapi),
    );

    const itensData = vinculos.map((vinculo) => {
      const codigo = normalizarCodigoSinapi(vinculo.material.codigoSinapi);
      const precoUnitario = (codigo && precos.get(codigo)) ?? null;
      const quantidade = vinculo.quantidade; // Prisma.Decimal
      const precoTotal = precoUnitario ? precoUnitario.mul(quantidade) : null;

      return {
        materialId: vinculo.material.id,
        descricao: vinculo.material.nome,
        unidade: vinculo.material.unidade,
        quantidade,
        precoUnitario,
        precoTotal,
        origemPreco: precoUnitario ? OrigemPreco.SINAPI : OrigemPreco.PENDENTE,
      };
    });

    const lista = await prisma.$transaction(async (tx) => {
      return tx.listaCompras.create({
        data: {
          obraId: etapa.obraId,
          etapaId: etapa.id,
          itens: { create: itensData },
        },
        include: { itens: true },
      });
    });

    return { ...lista, totais: this.calcularTotais(lista.itens) };
  }

  /** Retorna uma lista com seus itens e os totais orçados. */
  public async buscar(listaId: string, usuarioId: string) {
    const lista = await this.buscarListaDoUsuario(listaId, usuarioId);
    return { ...lista, totais: this.calcularTotais(lista.itens) };
  }

  /** Lista todas as listas de compras de uma obra, com totais. */
  public async listarPorObra(obraId: string, usuarioId: string) {
    const obra = await prisma.obra.findFirst({
      where: { id: obraId, usuarioId },
      select: { id: true },
    });
    if (!obra) {
      throw new AppError("Obra não encontrada.", 404);
    }

    const listas = await prisma.listaCompras.findMany({
      where: { obraId },
      orderBy: { geradaEm: "desc" },
      include: { itens: true },
    });

    return listas.map((lista) => ({ ...lista, totais: this.calcularTotais(lista.itens) }));
  }

  /** Remove uma lista (e seus itens em cascata) validando ownership. */
  public async remover(listaId: string, usuarioId: string): Promise<void> {
    await this.buscarListaDoUsuario(listaId, usuarioId);
    await prisma.listaCompras.delete({ where: { id: listaId } });
  }

  /** Soma os precoTotal congelados, contando itens ainda sem preço estimado. */
  private calcularTotais(itens: { precoTotal: Prisma.Decimal | null }[]): TotaisLista {
    let total = new Prisma.Decimal(0);
    let semPreco = 0;

    for (const item of itens) {
      if (item.precoTotal) {
        total = total.add(item.precoTotal);
      } else {
        semPreco += 1;
      }
    }

    return {
      totalItens: itens.length,
      itensSemPreco: semPreco,
      totalOrcado: total.toFixed(2),
    };
  }
}

export const listaComprasService = new ListaComprasService();