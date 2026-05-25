ALTER TABLE `Gasto`
ADD COLUMN `recorrenciaPaiId` VARCHAR(191) NULL,
ADD COLUMN `dataInicioRecorrencia` DATETIME(3) NULL,
ADD COLUMN `dataFimRecorrencia` DATETIME(3) NULL,
ADD INDEX `Gasto_recorrenciaPaiId_idx` (`recorrenciaPaiId`),
ADD UNIQUE INDEX `Gasto_recorrenciaPaiId_competencia_key` (`recorrenciaPaiId`, `competencia`),
ADD CONSTRAINT `Gasto_recorrenciaPaiId_fkey` FOREIGN KEY (`recorrenciaPaiId`) REFERENCES `Gasto` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
