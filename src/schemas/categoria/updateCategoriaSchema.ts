import joi from 'joi';

const updateCategoriaSchema = joi.object({
    descricao: joi.string().min(2).max(50).optional().messages({
        'string.min': 'O nome da categoria deve ter pelo menos 2 caracteres.',
        'string.max': 'O nome da categoria nao pode ter mais de 50 caracteres.',
    }),
    iconName: joi.string().min(1).max(8).optional().messages({
        'string.empty': 'O icone da categoria nao pode ser vazio.',
    }),
    cor: joi.string().max(30).optional().allow(null, '').messages({
        'string.base': 'A cor da categoria deve ser um texto.',
    }),
    teto: joi.number().min(0).optional().allow(null).messages({
        'number.base': 'O teto da categoria deve ser um numero.',
        'number.min': 'O teto da categoria deve ser maior ou igual a zero.',
    }),
});

export { updateCategoriaSchema };
