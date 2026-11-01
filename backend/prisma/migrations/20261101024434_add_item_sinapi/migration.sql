-- CreateEnum
CREATE TYPE "RegimeSinapi" AS ENUM ('DESONERADO', 'NAO_DESONERADO');

-- CreateEnum
CREATE TYPE "TipoSinapi" AS ENUM ('INSUMO', 'COMPOSICAO');

-- CreateTable
CREATE TABLE "ItemSinapi" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "precoMediano" DECIMAL(12,2) NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "regime" "RegimeSinapi" NOT NULL DEFAULT 'NAO_DESONERADO',
    "tipo" "TipoSinapi" NOT NULL DEFAULT 'INSUMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemSinapi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemSinapi_codigo_idx" ON "ItemSinapi"("codigo");

-- CreateIndex
CREATE INDEX "ItemSinapi_uf_idx" ON "ItemSinapi"("uf");

-- CreateIndex
CREATE UNIQUE INDEX "ItemSinapi_codigo_uf_mesReferencia_anoReferencia_regime_key" ON "ItemSinapi"("codigo", "uf", "mesReferencia", "anoReferencia", "regime");

-- Garante a extensão no schema public (compartilhado entre schemas de teste e dev)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Cria o índice GIN referenciando explicitamente a classe de operadores do public
CREATE INDEX IF NOT EXISTS "idx_item_sinapi_descricao_trgm" 
ON "ItemSinapi" USING gin ("descricao" public.gin_trgm_ops);