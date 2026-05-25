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
    numeroParcelas: joi.when('origemLancamento', {
        is: 'parcelado',
        then: joi.number().integer().min(2).required().messages({
            'number.base': 'O numero de parcelas deve ser um numero.',
            'number.integer': 'O numero de parcelas deve ser inteiro.',
            'number.min': 'O numero de parcelas deve ser pelo menos 2.',
            'any.required': 'Informe o numero de parcelas para um lancamento parcelado.',
        }),
        otherwise: joi.number().integer().min(1).optional(),
    }),
    naoCompartilhar: joi.boolean().optional().messages({
        'boolean.base': 'O campo nao compartilhar deve ser verdadeiro ou falso.',
    }),
    valor: joi.number().positive().required().messages({
        'number.base': 'O valor deve ser um numero.',
    }),
    competencia: joi.date().optional().allow(null).messages({
        'date.base': 'A competencia deve ser uma data valida.',
    }),
    dataVencimento: joi.when('origemLancamento', {
        is: joi.valid('parcelado', 'recorrente'),
        then: joi.date().required().messages({
            'date.base': 'A data de vencimento deve ser uma data valida.',
            'any.required': 'A data de vencimento e obrigatoria para lancamentos parcelados ou recorrentes.',
        }),
        otherwise: joi.date().optional().allow(null).messages({
            'date.base': 'A data de vencimento deve ser uma data valida.',
        }),
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
    cartaoCreditoId: joi.string().uuid().optional().allow(null, '').messages({
        'string.base': 'O cartao de credito deve ser um texto.',
        'string.uuid': 'O cartao de credito deve ser um UUID valido.',
    }),
    dataFimRecorrencia: joi.date().optional().allow(null).messages({
        'date.base': 'A data de fim da recorrencia deve ser uma data valida.',
    }),
}).custom((value, helpers) => {
    if (
        value.origemLancamento === 'recorrente'
        && value.dataFimRecorrencia
        && value.dataVencimento
        && new Date(value.dataFimRecorrencia).getTime() < new Date(value.dataVencimento).getTime()
    ) {
        return helpers.error('any.invalid');
    }

    return value;
}, 'validacao de recorrencia')
    .messages({
        'any.invalid': 'A data final da recorrencia nao pode ser anterior a data de vencimento inicial.',
    });

export { createGastoSchema };
