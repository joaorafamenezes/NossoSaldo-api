import joi from "joi";

const solicitarResetSenhaSchema = joi.object({
  email: joi.string().email().required().messages({
    "string.email": "O email e invalido.",
    "any.required": "O email e obrigatorio.",
  }),
});

export { solicitarResetSenhaSchema };
