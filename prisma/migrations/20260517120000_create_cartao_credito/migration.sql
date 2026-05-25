CREATE TABLE `CartaoCredito` (
  `id` VARCHAR(191) NOT NULL,
  `descricao` VARCHAR(191) NOT NULL,
  `diaFechamento` INTEGER NOT NULL,
  `diaVencimento` INTEGER NOT NULL,
  `observacoes` TEXT NULL,
  `usuarioId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `CartaoCredito_usuarioId_idx` (`usuarioId`),
  CONSTRAINT `CartaoCredito_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Gasto`
ADD COLUMN `cartaoCreditoId` VARCHAR(191) NULL,
ADD INDEX `Gasto_cartaoCreditoId_idx` (`cartaoCreditoId`),
ADD CONSTRAINT `Gasto_cartaoCreditoId_fkey` FOREIGN KEY (`cartaoCreditoId`) REFERENCES `CartaoCredito` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
