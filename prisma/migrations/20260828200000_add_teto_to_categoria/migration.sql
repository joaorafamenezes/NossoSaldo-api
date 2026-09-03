-- Adiciona apenas o campo teto na tabela Categoria
ALTER TABLE "Categoria" ADD COLUMN IF NOT EXISTS "teto" DECIMAL(10, 2) NULL;

-- Remove a coluna redundante orcamentoMensal caso tenha sido criada
ALTER TABLE "Categoria" DROP COLUMN IF EXISTS "orcamentoMensal";
