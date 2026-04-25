import joi from 'joi';

const atualizaSenhaUsuarioSchema = joi.object({
    senha: joi.string().min(6).max(50).required().messages({
        'string.min': 'A senha deve ter pelo menos 6 caracteres.',
        'string.max': 'A senha não pode ter mais de 50 caracteres.',
        'any.required': 'A senha é obrigatória.',
    }),
});

export { atualizaSenhaUsuarioSchema };