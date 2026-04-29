-- Migration: Create Gasto table
-- This migration creates the Gasto table for expenses with relationships to Categoria, Usuario, and ContaConjunta.

CREATE TABLE `Gasto` (
  `id` VARCHAR(191) NOT NULL,
  `descricao` VARCHAR(191) NOT NULL,
  `tipo` ENUM('receita', 'despesa') NOT NULL,
  `status` ENUM('pendente', 'pago', 'atrasado', 'cancelado') NOT NULL,
  `origemLancamento` ENUM('unico', 'recorrente', 'parcelado') NOT NULL,
  `valor` DECIMAL(10, 2) NOT NULL,
  `competencia` DATETIME(3) NULL,
  `dataVencimento` DATETIME(3) NULL,
  `dataPagamento` DATETIME(3) NULL,
  `observacao` TEXT NULL,
  `categoriaId` VARCHAR(191) NOT NULL,
  `responsavelId` VARCHAR(191) NOT NULL,
  `contaConjuntaId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Gasto_categoriaId_idx` (`categoriaId`),
  INDEX `Gasto_responsavelId_idx` (`responsavelId`),
  INDEX `Gasto_contaConjuntaId_idx` (`contaConjuntaId`),
  CONSTRAINT `Gasto_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `Gasto_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `Usuario` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `Gasto_contaConjuntaId_fkey` FOREIGN KEY (`contaConjuntaId`) REFERENCES `ContaConjunta` (`id`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
