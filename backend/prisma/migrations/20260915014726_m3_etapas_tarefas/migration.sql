/*
  Warnings:

  - Made the column `ordem` on table `etapa` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA');

-- AlterTable
ALTER TABLE "etapa" ALTER COLUMN "ordem" SET NOT NULL,
ALTER COLUMN "ordem" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "tarefa" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "data_inicio_prev" TIMESTAMP(3),
    "data_fim_prev" TIMESTAMP(3),
    "data_conclusao" TIMESTAMP(3),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "etapa_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tarefa_etapa_id_idx" ON "tarefa"("etapa_id");

-- CreateIndex
CREATE INDEX "tarefa_status_idx" ON "tarefa"("status");

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
