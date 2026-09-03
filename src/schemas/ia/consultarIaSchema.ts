import joi from "joi";

const consultarIaSchema = joi.object({
  pergunta: joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "O campo 'pergunta' e obrigatorio.",
    "string.min": "O campo 'pergunta' deve ter pelo menos 1 caractere.",
    "string.max": "O campo 'pergunta' deve ter no maximo 2000 caracteres.",
    "any.required": "O campo 'pergunta' e obrigatorio.",
  }),
});

export { consultarIaSchema };

