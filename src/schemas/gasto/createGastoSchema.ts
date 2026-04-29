import joi from 'joi';

const createGastoSchema = joi.object({
    descricao: joi.string().required().messages({
        'string.empty': 'A descricao e obrigatoria.',
        'any.required': 'A descricao e obrigatoria.',
    }),
    tipo: joi.string().valid('receita', 'despesa').required().messages({
        'any.only': 'O tipo deve ser receita ou despesa.',
        'any.required': 'O tipo e obrigatorio.',
    }),
    status: joi.string().valid('pendente', 'pago', 'atrasado', 'cancelado').required().messages({
        'any.only': 'O status deve ser pendente, pago, atrasado ou cancelado.',
        'any.required': 'O status e obrigatorio.',
    }),
    origemLancamento: joi.string().valid('unico', 'recorrente', 'parcelado').required().messages({
        'any.only': 'A origem do lancamento deve ser unico, recorrente ou parcelado.',
        'any.required': 'A origem do lancamento e obrigatoria.',
    }),
    valor: joi.number().positive().required().messages({
        'number.base': 'O valor deve ser um numero.',
    }),
    competencia: joi.date().optional().allow(null).messages({
        'date.base': 'A competencia deve ser uma data valida.',
    }),
    dataVencimento: joi.date().optional().allow(null).messages({
        'date.base': 'A data de vencimento deve ser uma data valida.',
    }),
    dataPagamento: joi.date().optional().allow(null).messages({
        'date.base': 'A data de pagamento deve ser uma data valida.',
    }),
    observacao: joi.string().optional().allow(null, '').messages({
        'string.base': 'A observacao deve ser um texto.',
    }),
    categoriaId: joi.string().uuid().required().messages({
        'string.base': 'A categoria deve ser um texto.',
        'string.uuid': 'A categoria deve ser um UUID valido.',
        'any.required': 'A categoria e obrigatoria.',
    }),
    contaConjuntaId: joi.string().uuid().optional().allow(null).messages({
        'string.uuid': 'A conta conjunta deve ser um UUID valido.',
    }),
});

export { createGastoSchema };
