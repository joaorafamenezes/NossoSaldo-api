import joi from "joi";

const pagarGastoSchema = joi.object({
    dataPagamento: joi.date().optional().allow(null).messages({
        "date.base": "A data de pagamento deve ser uma data valida.",
    }),
});

export { pagarGastoSchema };
