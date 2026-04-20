-- Migration: Create ContaConjunta table
-- This migration creates the ContaConjunta table with relationships to Usuario table.

CREATE TABLE `ContaConjunta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nomeConta` VARCHAR(191) NOT NULL,
  `usuario1Id` VARCHAR(191) NOT NULL,
  `usuario2Id` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ContaConjunta_usuario1Id_usuario2Id_key` (`usuario1Id`, `usuario2Id`),
  INDEX `ContaConjunta_usuario2Id_idx` (`usuario2Id`),
  CONSTRAINT `ContaConjunta_usuario1Id_fkey` FOREIGN KEY (`usuario1Id`) REFERENCES `Usuario` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ContaConjunta_usuario2Id_fkey` FOREIGN KEY (`usuario2Id`) REFERENCES `Usuario` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
