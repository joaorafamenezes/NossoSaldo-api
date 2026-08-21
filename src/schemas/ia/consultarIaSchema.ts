import joi from "joi";

const consultarIaSchema = joi.object({
  pergunta: joi.string().trim().min(3).max(500).required().messages({
    "string.empty": "O campo 'pergunta' e obrigatorio.",
    "string.min": "O campo 'pergunta' deve ter pelo menos 3 caracteres.",
    "string.max": "O campo 'pergunta' deve ter no maximo 500 caracteres.",
    "any.required": "O campo 'pergunta' e obrigatorio.",
  }),
});

export { consultarIaSchema };
