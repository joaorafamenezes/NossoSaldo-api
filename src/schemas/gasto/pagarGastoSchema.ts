import joi from "joi";

const pagarGastoSchema = joi.object({
    dataPagamento: joi.date().optional().allow(null).messages({
        "date.base": "A data de pagamento deve ser uma data valida.",
    }),
    competencia: joi.string().pattern(/^\d{4}-\d{2}$/).optional().messages({
        "string.pattern.base": "A competencia deve estar no formato YYYY-MM.",
    }),
    pagarParcelaMesVigente: joi.boolean().optional(),
});

export { pagarGastoSchema };
