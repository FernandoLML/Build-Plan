-- CreateEnum
CREATE TYPE "OrigemPreco" AS ENUM ('SINAPI', 'MANUAL', 'PENDENTE');

-- AlterTable: converte com cast para preservar os valores existentes (o Prisma
-- geraria DROP/ADD COLUMN). UPPER cobre eventuais valores antigos em minúsculas.
ALTER TABLE "item_compra"
  ALTER COLUMN "origem_preco" TYPE "OrigemPreco"
  USING UPPER("origem_preco")::"OrigemPreco";

-- AlterTable: adiciona como nullable para preencher as linhas existentes.
ALTER TABLE "ItemSinapi" ADD COLUMN "codigoNormalizado" TEXT;

-- Backfill: mesma regra de normalizarCodigoSinapi (sinapi.codigo.ts), inclusive
-- o caso "todos zeros", que mantém o código original.
UPDATE "ItemSinapi"
SET "codigoNormalizado" = COALESCE(
  NULLIF(regexp_replace(btrim("codigo"), '^0+', ''), ''),
  btrim("codigo")
);

ALTER TABLE "ItemSinapi" ALTER COLUMN "codigoNormalizado" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ItemSinapi_codigoNormalizado_uf_mesReferencia_anoReferencia_idx" ON "ItemSinapi"("codigoNormalizado", "uf", "mesReferencia", "anoReferencia");
