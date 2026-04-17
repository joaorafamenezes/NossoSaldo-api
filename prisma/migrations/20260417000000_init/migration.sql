-- Migration: init
-- This migration creates the Usuario table for the NossoSaldo database.

CREATE TABLE `Usuario` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `senha` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Usuario_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
