import joi from 'joi';

const atualizaUsuarioSchema = joi.object({
    nome: joi.string().required().messages({
        'string.empty': 'O nome é obrigatório.',
        'any.required': 'O nome é obrigatório.',
    }),
    email: joi.string().email().required().messages({
        'string.email': 'O email é inválido.',
        'any.required': 'O email é obrigatório.',
    }),
});

export { atualizaUsuarioSchema };