ALTER TABLE `Categoria`
ADD COLUMN `cor` VARCHAR(20) NOT NULL DEFAULT '#10b981';

UPDATE `Categoria`
SET `cor` = CASE
  WHEN LOWER(`descricao`) LIKE '%salario%' OR LOWER(`descricao`) LIKE '%renda%' THEN '#10b981'
  WHEN LOWER(`descricao`) LIKE '%moradia%' OR LOWER(`descricao`) LIKE '%aluguel%' OR LOWER(`descricao`) LIKE '%contas%' THEN '#6366f1'
  WHEN LOWER(`descricao`) LIKE '%supermercado%' OR LOWER(`descricao`) LIKE '%feira%' OR LOWER(`descricao`) LIKE '%alimentacao%' THEN '#f59e0b'
  WHEN LOWER(`descricao`) LIKE '%restaurante%' OR LOWER(`descricao`) LIKE '%delivery%' THEN '#ec4899'
  WHEN LOWER(`descricao`) LIKE '%transporte%' OR LOWER(`descricao`) LIKE '%combustivel%' OR LOWER(`descricao`) LIKE '%uber%' THEN '#3b82f6'
  WHEN LOWER(`descricao`) LIKE '%saude%' OR LOWER(`descricao`) LIKE '%farmacia%' THEN '#ef4444'
  WHEN LOWER(`descricao`) LIKE '%lazer%' OR LOWER(`descricao`) LIKE '%streaming%' OR LOWER(`descricao`) LIKE '%cinema%' THEN '#8b5cf6'
  WHEN LOWER(`descricao`) LIKE '%educacao%' OR LOWER(`descricao`) LIKE '%curso%' THEN '#14b8a6'
  WHEN LOWER(`descricao`) LIKE '%outros%' OR LOWER(`descricao`) LIKE '%imprevistos%' THEN '#64748b'
  ELSE '#10b981'
END;
