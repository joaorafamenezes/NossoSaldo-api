import joi from 'joi';

const createCategoriaSchema = joi.object({
    descricao: joi.string().min(2).max(50).required().messages({
        'string.min': 'O nome da categoria deve ter pelo menos 2 caracteres.',
        'string.max': 'O nome da categoria nao pode ter mais de 50 caracteres.',
        'string.empty': 'O nome da categoria e obrigatorio.',
        'any.required': 'O nome da categoria e obrigatorio.',
    }),
    iconName: joi.string().min(1).max(8).required().messages({
        'string.empty': 'O icone da categoria e obrigatorio.',
        'any.required': 'O icone da categoria e obrigatorio.',
    }),
});

export { createCategoriaSchema };
