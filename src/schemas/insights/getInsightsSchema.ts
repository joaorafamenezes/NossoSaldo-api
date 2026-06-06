import joi from "joi";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const getInsightsSchema = joi.object({
  de: joi.string().pattern(isoDatePattern).required().messages({
    "string.empty": "O parametro 'de' e obrigatorio.",
    "string.pattern.base": "O parametro 'de' deve estar no formato YYYY-MM-DD.",
    "any.required": "O parametro 'de' e obrigatorio.",
  }),
  ate: joi.string().pattern(isoDatePattern).required().messages({
    "string.empty": "O parametro 'ate' e obrigatorio.",
    "string.pattern.base": "O parametro 'ate' deve estar no formato YYYY-MM-DD.",
    "any.required": "O parametro 'ate' e obrigatorio.",
  }),
});

export { getInsightsSchema };
