import joi from "joi";

const configurarIaSchema = joi.object({
  apiKey: joi.string().trim().min(20).max(300).required().messages({
    "string.empty": "O campo 'apiKey' e obrigatorio.",
    "string.min": "A chave da OpenAI parece invalida.",
    "string.max": "A chave da OpenAI excede o tamanho permitido.",
    "any.required": "O campo 'apiKey' e obrigatorio.",
  }),
  modelo: joi.string().trim().min(1).max(80).optional(),
});

export { configurarIaSchema };
