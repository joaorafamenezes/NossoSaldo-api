import joi from "joi";

const updateGastoSchema = joi.object({
    descricao: joi.string().messages({
        "string.empty": "A descricao nao pode ser vazia.",
    }),
    tipo: joi.string().valid("receita", "despesa").messages({
        "any.only": "O tipo deve ser receita ou despesa.",
    }),
    status: joi.string().valid("pendente", "pago", "atrasado", "cancelado").messages({
        "any.only": "O status deve ser pendente, pago, atrasado ou cancelado.",
    }),
    origemLancamento: joi.string().valid("unico", "recorrente", "parcelado").messages({
        "any.only": "A origem do lancamento deve ser unico, recorrente ou parcelado.",
    }),
    valor: joi.number().positive().messages({
        "number.base": "O valor deve ser um numero.",
    }),
    competencia: joi.date().allow(null).messages({
        "date.base": "A competencia deve ser uma data valida.",
    }),
    dataVencimento: joi.date().allow(null).messages({
        "date.base": "A data de vencimento deve ser uma data valida.",
    }),
    dataPagamento: joi.date().allow(null).messages({
        "date.base": "A data de pagamento deve ser uma data valida.",
    }),
    observacao: joi.string().allow(null, "").messages({
        "string.base": "A observacao deve ser um texto.",
    }),
    categoriaId: joi.string().uuid().messages({
        "string.base": "A categoria deve ser um texto.",
        "string.uuid": "A categoria deve ser um UUID valido.",
    }),
    contaConjuntaId: joi.string().uuid().allow(null).messages({
        "string.uuid": "A conta conjunta deve ser um UUID valido.",
    }),
})
    .min(1)
    .messages({
        "object.min": "Informe ao menos um campo para atualizar o gasto.",
    });

export { updateGastoSchema };
