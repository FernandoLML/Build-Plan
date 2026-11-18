// Caminho: /backend/src/services/material-saldo.ts
// Saldo de um material: quantidade no catálogo menos o que já está vinculado
// às etapas. Usado ao criar vínculos e ao editar a quantidade do material.

import { Prisma } from "@prisma/client";

type Transacao = Prisma.TransactionClient;

/**
 * Trava a linha do material até o fim da transação (SELECT ... FOR UPDATE) e
 * devolve a quantidade dele no catálogo. Outra transação que tente vincular o
 * mesmo material espera esta terminar, então as duas nunca leem o mesmo saldo.
 */
export async function travarMaterial(tx: Transacao, materialId: string): Promise<Prisma.Decimal> {
  const linhas = await tx.$queryRaw<{ quantidade: Prisma.Decimal }[]>`
    SELECT quantidade FROM material WHERE id = ${materialId} FOR UPDATE
  `;
  return new Prisma.Decimal(linhas[0]?.quantidade ?? 0);
}

/** Soma das quantidades do material em todos os vínculos (todas as etapas). */
export async function somarVinculado(tx: Transacao, materialId: string): Promise<Prisma.Decimal> {
  const soma = await tx.vinculoMaterialEtapa.aggregate({
    where: { materialId },
    _sum: { quantidade: true },
  });
  return soma._sum.quantidade ?? new Prisma.Decimal(0);
}

/** "12,5" em vez de "12.500": formato brasileiro, sem zeros à direita. */
export function formatarQuantidade(valor: Prisma.Decimal): string {
  return valor.toNumber().toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}
