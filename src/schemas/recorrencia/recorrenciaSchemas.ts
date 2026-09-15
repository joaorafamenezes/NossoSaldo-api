import joi from "joi";

export const createRecorrenciaSchema = joi.object({
  descricao: joi.string().trim().min(2).max(255).required().messages({
    "string.empty": "A descricao e obrigatoria.",
    "any.required": "A descricao e obrigatoria.",
  }),
  tipo: joi.string().valid("receita", "despesa").required().messages({
    "any.only": "O tipo deve ser 'receita' ou 'despesa'.",
    "any.required": "O tipo e obrigatorio.",
  }),
  valor: joi.number().positive().precision(2).required().messages({
    "number.positive": "O valor deve ser positivo.",
    "any.required": "O valor e obrigatorio.",
  }),
  diaVencimento: joi.number().integer().min(1).max(31).required().messages({
    "number.min": "O dia de vencimento deve ser entre 1 e 31.",
    "number.max": "O dia de vencimento deve ser entre 1 e 31.",
    "any.required": "O dia de vencimento e obrigatorio.",
  }),
  frequencia: joi.string().valid("mensal", "anual", "semanal").default("mensal"),
  dataInicio: joi.date().iso().required().messages({
    "date.format": "A data de inicio deve ser uma data valida.",
    "any.required": "A data de inicio e obrigatoria.",
  }),
  dataFim: joi.date().iso().allow(null).optional(),
  naoCompartilhar: joi.boolean().default(false),
  observacao: joi.string().trim().allow("", null).optional(),
  categoriaId: joi.string().uuid().required().messages({
    "string.guid": "O ID da categoria deve ser um UUID valido.",
    "any.required": "A categoria e obrigatoria.",
  }),
  cartaoCreditoId: joi.string().uuid().allow(null).optional(),
});

export const updateRecorrenciaSchema = joi.object({
  descricao: joi.string().trim().min(2).max(255).optional(),
  tipo: joi.string().valid("receita", "despesa").optional(),
  valor: joi.number().positive().precision(2).optional(),
  diaVencimento: joi.number().integer().min(1).max(31).optional(),
  frequencia: joi.string().valid("mensal", "anual", "semanal").optional(),
  dataInicio: joi.date().iso().optional(),
  dataFim: joi.date().iso().allow(null).optional(),
  naoCompartilhar: joi.boolean().optional(),
  observacao: joi.string().trim().allow("", null).optional(),
  categoriaId: joi.string().uuid().optional(),
  cartaoCreditoId: joi.string().uuid().allow(null).optional(),
});

export const pausarRecorrenciaSchema = joi.object({
  dataPausaInicio: joi.date().iso().allow(null).optional(),
  dataPausaFim: joi.date().iso().allow(null).optional(),
  motivoPausa: joi.string().trim().allow("", null).optional(),
});
