// Caminho: /backend/src/services/item-compra.service.ts
// Regra de negócio dos Itens de Compra (M4 — Fase 2).
// Permite adicionar itens manuais e "Informar" preços (Tela 5), recalculando
// e congelando o precoTotal. Ownership validado pela cadeia Item -> Lista -> Obra.

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app-error.js";
import type { AddItemInput, UpdateItemInput } from "../schemas/item-compra.schema.js";

export class ItemCompraService {
  /** Garante que a lista existe e pertence ao usuário. */
  private async assertListaDoUsuario(listaId: string, usuarioId: string): Promise<void> {
    const lista = await prisma.listaCompras.findFirst({
      where: { id: listaId, obra: { usuarioId } },
      select: { id: true },
    });
    if (!lista) {
      throw new AppError("Lista de compras não encontrada.", 404);
    }
  }

  /** Busca um item garantindo o ownership pela cadeia lista -> obra. */
  private async buscarItemDoUsuario(itemId: string, usuarioId: string) {
    const item = await prisma.itemCompra.findFirst({
      where: { id: itemId, listaCompras: { obra: { usuarioId } } },
    });
    if (!item) {
      throw new AppError("Item de compra não encontrado.", 404);
    }
    return item;
  }

  /** Adiciona um item à lista; congela precoTotal se o preço for informado. */
  public async adicionar(listaId: string, usuarioId: string, data: AddItemInput) {
    await this.assertListaDoUsuario(listaId, usuarioId);

    const quantidade = new Prisma.Decimal(data.quantidade);
    const precoUnitario =
      data.precoUnitario !== undefined ? new Prisma.Decimal(data.precoUnitario) : null;
    const precoTotal = precoUnitario ? precoUnitario.mul(quantidade) : null;

    return prisma.itemCompra.create({
      data: {
        listaComprasId: listaId,
        materialId: data.materialId,
        descricao: data.descricao,
        unidade: data.unidade,
        quantidade,
        precoUnitario,
        precoTotal,
        origemPreco: precoUnitario ? "MANUAL" : "PENDENTE",
      },
    });
  }

  /**
   * Atualiza um item. Ao alterar preço e/ou quantidade, recalcula e recongela
   * o precoTotal e marca a origem do preço como MANUAL ("Informar").
   */
  public async atualizar(itemId: string, usuarioId: string, data: UpdateItemInput) {
    const item = await this.buscarItemDoUsuario(itemId, usuarioId);

    // Valores efetivos após a atualização (mantém o atual quando não enviado).
    const quantidade =
      data.quantidade !== undefined ? new Prisma.Decimal(data.quantidade) : item.quantidade;
    const precoUnitario =
      data.precoUnitario !== undefined
        ? new Prisma.Decimal(data.precoUnitario)
        : item.precoUnitario;

    const precoTotal = precoUnitario ? precoUnitario.mul(quantidade) : null;

    // origemPreco vira MANUAL quando um preço foi informado nesta atualização.
    const origemPreco =
      data.precoUnitario !== undefined ? "MANUAL" : item.origemPreco;

    return prisma.itemCompra.update({
      where: { id: itemId },
      data: {
        descricao: data.descricao,
        unidade: data.unidade,
        quantidade,
        precoUnitario,
        precoTotal,
        origemPreco,
      },
    });
  }

  /** Remove um item da lista (validando ownership). */
  public async remover(itemId: string, usuarioId: string): Promise<void> {
    await this.buscarItemDoUsuario(itemId, usuarioId);
    await prisma.itemCompra.delete({ where: { id: itemId } });
  }
}

export const itemCompraService = new ItemCompraService();