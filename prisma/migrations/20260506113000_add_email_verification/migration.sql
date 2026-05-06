ALTER TABLE `Usuario`
ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

CREATE TABLE `EmailVerificationToken` (
  `id` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `usuarioId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmailVerificationToken_tokenHash_key` (`tokenHash`),
  INDEX `EmailVerificationToken_usuarioId_idx` (`usuarioId`),
  INDEX `EmailVerificationToken_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `EmailVerificationToken_usuarioId_fkey`
    FOREIGN KEY (`usuarioId`) REFERENCES `Usuario` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
