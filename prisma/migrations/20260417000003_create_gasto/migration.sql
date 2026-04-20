-- Migration: Create Gasto table
-- This migration creates the Gasto table for expenses with relationships to Categoria, Usuario, and ContaConjunta.

CREATE TABLE `Gasto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descricao` VARCHAR(191) NOT NULL,
  `valor` DECIMAL(10, 2) NOT NULL,
  `categoriaId` INT NOT NULL,
  `dataLancamento` DATETIME(3) NOT NULL,
  `responsavelId` VARCHAR(191) NOT NULL,
  `contaConjuntaId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Gasto_categoriaId_idx` (`categoriaId`),
  INDEX `Gasto_responsavelId_idx` (`responsavelId`),
  INDEX `Gasto_contaConjuntaId_idx` (`contaConjuntaId`),
  CONSTRAINT `Gasto_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `Gasto_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `Usuario` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `Gasto_contaConjuntaId_fkey` FOREIGN KEY (`contaConjuntaId`) REFERENCES `ContaConjunta` (`id`) ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
