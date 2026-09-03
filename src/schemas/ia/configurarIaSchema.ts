import joi from "joi";

const configurarIaSchema = joi.object({
  apiKey: joi.string().trim().min(10).max(300).required().messages({
    "string.empty": "O campo 'apiKey' e obrigatorio.",
    "string.min": "A chave de API parece invalida.",
    "string.max": "A chave de API excede o tamanho permitido.",
    "any.required": "O campo 'apiKey' e obrigatorio.",
  }),
  modelo: joi.string().trim().min(1).max(80).optional(),
  provedor: joi.string().trim().min(1).max(50).optional(),
});

export { configurarIaSchema };
