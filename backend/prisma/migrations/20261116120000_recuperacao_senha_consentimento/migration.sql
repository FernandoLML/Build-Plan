-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "consentimento_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "token_redefinicao_senha" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_redefinicao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_redefinicao_senha_token_hash_key" ON "token_redefinicao_senha"("token_hash");

-- CreateIndex
CREATE INDEX "token_redefinicao_senha_usuario_id_idx" ON "token_redefinicao_senha"("usuario_id");

-- AddForeignKey
ALTER TABLE "token_redefinicao_senha" ADD CONSTRAINT "token_redefinicao_senha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

