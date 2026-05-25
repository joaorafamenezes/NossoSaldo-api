CREATE TABLE `FaturaCartao` (
  `id` VARCHAR(191) NOT NULL,
  `cartaoCreditoId` VARCHAR(191) NOT NULL,
  `competencia` VARCHAR(191) NOT NULL,
  `dataAbertura` DATETIME(3) NOT NULL,
  `dataFechamento` DATETIME(3) NOT NULL,
  `dataVencimento` DATETIME(3) NOT NULL,
  `valorTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('aberta', 'fechada', 'paga', 'vencida', 'cancelada') NOT NULL DEFAULT 'aberta',
  `dataPagamento` DATETIME(3) NULL,
  `observacoes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `FaturaCartao_cartaoCreditoId_competencia_key` (`cartaoCreditoId`, `competencia`),
  INDEX `FaturaCartao_cartaoCreditoId_idx` (`cartaoCreditoId`),
  INDEX `FaturaCartao_competencia_idx` (`competencia`),
  INDEX `FaturaCartao_status_idx` (`status`),
  INDEX `FaturaCartao_dataVencimento_idx` (`dataVencimento`),
  CONSTRAINT `FaturaCartao_cartaoCreditoId_fkey` FOREIGN KEY (`cartaoCreditoId`) REFERENCES `CartaoCredito` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Gasto`
ADD COLUMN `faturaCartaoId` VARCHAR(191) NULL,
ADD INDEX `Gasto_faturaCartaoId_idx` (`faturaCartaoId`),
ADD CONSTRAINT `Gasto_faturaCartaoId_fkey` FOREIGN KEY (`faturaCartaoId`) REFERENCES `FaturaCartao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
