INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Alimentacao', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Alimentacao'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Moradia', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Moradia'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Transporte', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Transporte'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Saude', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Saude'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Educacao', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Educacao'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Lazer', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Lazer'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Investimentos', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Investimentos'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Salario', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Salario'
);

INSERT INTO `Categoria` (`id`, `descricao`, `createdAt`, `updatedAt`)
SELECT UUID(), 'Outros', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (
  SELECT 1 FROM `Categoria` WHERE `descricao` = 'Outros'
);
