import joi from "joi";

const validarEmailSchema = joi.object({
  token: joi.string().required().messages({
    "string.empty": "O token de verificacao e obrigatorio.",
    "any.required": "O token de verificacao e obrigatorio.",
  }),
});

export { validarEmailSchema };
