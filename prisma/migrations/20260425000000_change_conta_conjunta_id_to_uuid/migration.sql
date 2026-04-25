-- Alter ContaConjunta primary key from INT AUTO_INCREMENT to UUID string
-- and propagate the new key to Gasto.contaConjuntaId.

ALTER TABLE `Gasto` DROP FOREIGN KEY `Gasto_contaConjuntaId_fkey`;

ALTER TABLE `ContaConjunta`
  ADD COLUMN `newId` VARCHAR(191) NULL;

UPDATE `ContaConjunta`
SET `newId` = UUID()
WHERE `newId` IS NULL;

ALTER TABLE `ContaConjunta`
  MODIFY `newId` VARCHAR(191) NOT NULL;

ALTER TABLE `Gasto`
  ADD COLUMN `newContaConjuntaId` VARCHAR(191) NULL;

UPDATE `Gasto` AS `g`
INNER JOIN `ContaConjunta` AS `cc`
  ON `g`.`contaConjuntaId` = `cc`.`id`
SET `g`.`newContaConjuntaId` = `cc`.`newId`;

ALTER TABLE `ContaConjunta`
  DROP PRIMARY KEY,
  DROP COLUMN `id`,
  CHANGE COLUMN `newId` `id` VARCHAR(191) NOT NULL,
  ADD PRIMARY KEY (`id`);

ALTER TABLE `Gasto`
  DROP INDEX `Gasto_contaConjuntaId_idx`,
  DROP COLUMN `contaConjuntaId`,
  CHANGE COLUMN `newContaConjuntaId` `contaConjuntaId` VARCHAR(191) NOT NULL,
  ADD INDEX `Gasto_contaConjuntaId_idx` (`contaConjuntaId`),
  ADD CONSTRAINT `Gasto_contaConjuntaId_fkey`
    FOREIGN KEY (`contaConjuntaId`) REFERENCES `ContaConjunta`(`id`) ON DELETE RESTRICT;
