UPDATE `Gasto`
SET
  `recorrenciaPaiId` = `id`,
  `dataInicioRecorrencia` = COALESCE(`dataInicioRecorrencia`, `dataVencimento`, `competencia`),
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `origemLancamento` = 'recorrente'
  AND `recorrenciaPaiId` IS NULL
  AND `deletedAt` IS NULL;
