ALTER TABLE `CartaoCredito`
ADD COLUMN `cor` VARCHAR(255) NULL DEFAULT 'from-purple-900 via-indigo-950 to-black',
ADD COLUMN `corGradiente` VARCHAR(255) NULL DEFAULT 'from-purple-900 via-indigo-950 to-black',
ADD COLUMN `ultimosDigitos` VARCHAR(4) NULL,
ADD COLUMN `bandeira` VARCHAR(30) NULL DEFAULT 'mastercard';

UPDATE `CartaoCredito`
SET `corGradiente` = CASE
  WHEN LOWER(`descricao`) LIKE '%nubank%' THEN 'from-purple-900 via-purple-950 to-black'
  WHEN LOWER(`descricao`) LIKE '%inter%' THEN 'from-orange-600 via-amber-700 to-black'
  WHEN LOWER(`descricao`) LIKE '%itau%' OR LOWER(`descricao`) LIKE '%itaú%' THEN 'from-orange-500 via-blue-900 to-black'
  WHEN LOWER(`descricao`) LIKE '%bradesco%' OR LOWER(`descricao`) LIKE '%bradescard%' THEN 'from-red-600 via-red-900 to-black'
  WHEN LOWER(`descricao`) LIKE '%santander%' THEN 'from-red-700 via-red-950 to-black'
  WHEN LOWER(`descricao`) LIKE '%c6%' THEN 'from-zinc-800 via-zinc-900 to-black'
  ELSE 'from-zinc-900 via-slate-900 to-black'
END,
`cor` = `corGradiente`
WHERE `cor` IS NULL OR `corGradiente` IS NULL;
