import joi from "joi";

const redefinirSenhaComTokenSchema = joi.object({
  token: joi.string().min(20).required().messages({
    "string.min": "O token informado e invalido.",
    "any.required": "O token e obrigatorio.",
  }),
  senha: joi.string().min(6).max(50).required().messages({
    "string.min": "A senha deve ter pelo menos 6 caracteres.",
    "string.max": "A senha nao pode ter mais de 50 caracteres.",
    "any.required": "A senha e obrigatoria.",
  }),
});

export { redefinirSenhaComTokenSchema };
