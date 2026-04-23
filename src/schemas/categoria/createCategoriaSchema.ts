import joi from 'joi';

const createCategoriaSchema = joi.object({
    descricao: joi.string().min(2).max(50).required().messages({
        'string.min': 'O nome da categoria deve ter pelo menos 2 caracteres.',
        'string.max': 'O nome da categoria não pode ter mais de 50 caracteres.',
        'string.empty': 'O nome da categoria é obrigatório.',
        'any.required': 'O nome da categoria é obrigatório.',
    })
});

export { createCategoriaSchema };