-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('GESTOR', 'PROPRIETARIO');

-- CreateEnum
CREATE TYPE "OrigemMaterial" AS ENUM ('MEMORIAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusVinculo" AS ENUM ('PREVISTO', 'RECEBIDO', 'APLICADO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'GESTOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "endereco" TEXT,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "obra_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especificacao" TEXT,
    "unidade" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "origem" "OrigemMaterial" NOT NULL DEFAULT 'MANUAL',
    "codigo_sinapi" TEXT,
    "obra_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculo_material_etapa" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "etapa_id" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "status" "StatusVinculo" NOT NULL DEFAULT 'PREVISTO',
    "local" TEXT,
    "data_recebimento" TIMESTAMP(3),
    "data_aplicacao" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vinculo_material_etapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lista_compras" (
    "id" TEXT NOT NULL,
    "obra_id" TEXT NOT NULL,
    "etapa_id" TEXT,
    "gerada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_compra" (
    "id" TEXT NOT NULL,
    "lista_compras_id" TEXT NOT NULL,
    "material_id" TEXT,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "preco_unitario" DECIMAL(12,2),
    "preco_total" DECIMAL(12,2),
    "origem_preco" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_rastreabilidade" (
    "id" TEXT NOT NULL,
    "vinculo_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "status_anterior" "StatusVinculo",
    "status_novo" "StatusVinculo" NOT NULL,
    "detalhes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_rastreabilidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "obra_usuario_id_idx" ON "obra"("usuario_id");

-- CreateIndex
CREATE INDEX "etapa_obra_id_idx" ON "etapa"("obra_id");

-- CreateIndex
CREATE INDEX "material_obra_id_idx" ON "material"("obra_id");

-- CreateIndex
CREATE INDEX "material_codigo_sinapi_idx" ON "material"("codigo_sinapi");

-- CreateIndex
CREATE INDEX "vinculo_material_etapa_etapa_id_idx" ON "vinculo_material_etapa"("etapa_id");

-- CreateIndex
CREATE INDEX "vinculo_material_etapa_status_idx" ON "vinculo_material_etapa"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vinculo_material_etapa_material_id_etapa_id_key" ON "vinculo_material_etapa"("material_id", "etapa_id");

-- CreateIndex
CREATE INDEX "lista_compras_obra_id_idx" ON "lista_compras"("obra_id");

-- CreateIndex
CREATE INDEX "lista_compras_etapa_id_idx" ON "lista_compras"("etapa_id");

-- CreateIndex
CREATE INDEX "item_compra_lista_compras_id_idx" ON "item_compra"("lista_compras_id");

-- CreateIndex
CREATE INDEX "log_rastreabilidade_vinculo_id_idx" ON "log_rastreabilidade"("vinculo_id");

-- CreateIndex
CREATE INDEX "log_rastreabilidade_usuario_id_idx" ON "log_rastreabilidade"("usuario_id");

-- AddForeignKey
ALTER TABLE "obra" ADD CONSTRAINT "obra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo_material_etapa" ADD CONSTRAINT "vinculo_material_etapa_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo_material_etapa" ADD CONSTRAINT "vinculo_material_etapa_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_compras" ADD CONSTRAINT "lista_compras_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lista_compras" ADD CONSTRAINT "lista_compras_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_compra" ADD CONSTRAINT "item_compra_lista_compras_id_fkey" FOREIGN KEY ("lista_compras_id") REFERENCES "lista_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_rastreabilidade" ADD CONSTRAINT "log_rastreabilidade_vinculo_id_fkey" FOREIGN KEY ("vinculo_id") REFERENCES "vinculo_material_etapa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_rastreabilidade" ADD CONSTRAINT "log_rastreabilidade_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
