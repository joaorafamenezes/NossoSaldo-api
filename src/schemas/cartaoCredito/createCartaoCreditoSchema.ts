import joi from "joi";

const createCartaoCreditoSchema = joi.object({
  descricao: joi.string().min(2).max(80).required().messages({
    "string.min": "A descricao do cartao deve ter pelo menos 2 caracteres.",
    "string.max": "A descricao do cartao nao pode ter mais de 80 caracteres.",
    "string.empty": "A descricao do cartao e obrigatoria.",
    "any.required": "A descricao do cartao e obrigatoria.",
  }),
  diaFechamento: joi.number().integer().min(1).max(31).required().messages({
    "number.base": "O dia de fechamento deve ser um numero.",
    "number.integer": "O dia de fechamento deve ser um numero inteiro.",
    "number.min": "O dia de fechamento deve estar entre 1 e 31.",
    "number.max": "O dia de fechamento deve estar entre 1 e 31.",
    "any.required": "O dia de fechamento e obrigatorio.",
  }),
  diaVencimento: joi.number().integer().min(1).max(31).required().messages({
    "number.base": "O dia de vencimento deve ser um numero.",
    "number.integer": "O dia de vencimento deve ser um numero inteiro.",
    "number.min": "O dia de vencimento deve estar entre 1 e 31.",
    "number.max": "O dia de vencimento deve estar entre 1 e 31.",
    "any.required": "O dia de vencimento e obrigatorio.",
  }),
  valorLimite: joi.number().positive().required().messages({
    "number.base": "O limite do cartao deve ser um numero.",
    "number.positive": "O limite do cartao deve ser maior que zero.",
    "any.required": "O limite do cartao e obrigatorio.",
  }),
  observacoes: joi.string().allow("").max(500).optional().messages({
    "string.max": "As observacoes nao podem ter mais de 500 caracteres.",
  }),
});

export { createCartaoCreditoSchema };
