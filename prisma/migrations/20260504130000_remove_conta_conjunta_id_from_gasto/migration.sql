ALTER TABLE `Gasto`
DROP FOREIGN KEY `Gasto_contaConjuntaId_fkey`;

ALTER TABLE `Gasto`
DROP INDEX `Gasto_contaConjuntaId_idx`,
DROP COLUMN `contaConjuntaId`;
