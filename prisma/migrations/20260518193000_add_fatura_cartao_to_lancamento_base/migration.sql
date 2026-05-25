ALTER TABLE `LancamentoBase`
ADD COLUMN `faturaCartaoId` VARCHAR(191) NULL,
ADD INDEX `LancamentoBase_faturaCartaoId_idx` (`faturaCartaoId`),
ADD CONSTRAINT `LancamentoBase_faturaCartaoId_fkey` FOREIGN KEY (`faturaCartaoId`) REFERENCES `FaturaCartao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
