import joi from 'joi';

const createContaConjuntaSchema = joi.object({
    nomeConta: joi.string().required().messages({
        'string.empty': 'O nome da conta é obrigatório.',
        'any.required': 'O nome da conta é obrigatório.',
    }),
    usuarioConjunto: joi.string().required().messages({
        'string.empty': 'O ID do usuário conjunto é obrigatório.',
        'any.required': 'O ID do usuário conjunto é obrigatório.',
    }),
});

export { createContaConjuntaSchema };