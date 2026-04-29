CREATE TABLE `LancamentoBase` (
  `id` VARCHAR(191) NOT NULL,
  `gastoId` VARCHAR(191) NOT NULL,
  `descricao` VARCHAR(191) NOT NULL,
  `valorParcela` DECIMAL(10, 2) NOT NULL,
  `numeroParcela` INT NOT NULL,
  `dataVencimentoParcela` DATETIME(3) NOT NULL,
  `dataPagamentoParcela` DATETIME(3) NULL,
  `status` ENUM('pendente', 'pago', 'atrasado', 'cancelado') NOT NULL,
  `competencia` DATETIME(3) NOT NULL,
  `observacao` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `LancamentoBase_gastoId_idx` (`gastoId`),
  CONSTRAINT `LancamentoBase_gastoId_fkey`
    FOREIGN KEY (`gastoId`) REFERENCES `Gasto` (`id`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
