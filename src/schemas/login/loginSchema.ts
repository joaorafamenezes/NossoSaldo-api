import joi from 'joi';

const loginSchema = joi.object({
    email: joi.string().email().required().messages({
        'string.email': 'O email é inválido.',
        'any.required': 'O email é obrigatório.',
    }),
    senha: joi.string().min(6).max(50).required().messages({
        'string.min': 'A senha deve ter pelo menos 6 caracteres.',
        'string.max': 'A senha não pode ter mais de 50 caracteres.',
        'any.required': 'A senha é obrigatória.',
    }),
});

export { loginSchema };