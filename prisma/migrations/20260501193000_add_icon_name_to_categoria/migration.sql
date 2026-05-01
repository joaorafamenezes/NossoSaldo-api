ALTER TABLE `Categoria`
ADD COLUMN `iconName` VARCHAR(8) NOT NULL DEFAULT '🏷️';

UPDATE `Categoria`
SET `iconName` = CASE
  WHEN LOWER(`descricao`) = 'alimentacao' THEN '🍔'
  WHEN LOWER(`descricao`) = 'moradia' THEN '🏠'
  WHEN LOWER(`descricao`) = 'transporte' THEN '🚗'
  WHEN LOWER(`descricao`) = 'saude' THEN '💊'
  WHEN LOWER(`descricao`) = 'educacao' THEN '🎓'
  WHEN LOWER(`descricao`) = 'lazer' THEN '🎉'
  WHEN LOWER(`descricao`) = 'investimentos' THEN '📈'
  WHEN LOWER(`descricao`) = 'salario' THEN '💰'
  WHEN LOWER(`descricao`) = 'outros' THEN '📦'
  ELSE '🏷️'
END
WHERE `iconName` = '🏷️' OR `iconName` IS NULL;
