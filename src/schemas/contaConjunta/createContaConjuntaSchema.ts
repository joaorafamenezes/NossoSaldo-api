import joi from 'joi';

const createContaConjuntaSchema = joi.object({
    nomeConta: joi.string().required().messages({
        'string.empty': 'O nome da conta é obrigatório.',
        'any.required': 'O nome da conta é obrigatório.',
    }),
    usuario1Id: joi.string().uuid().required().messages({
        'string.uuid': 'O ID do primeiro usuário é inválido.',
        'any.required': 'O ID do primeiro usuário é obrigatório.',
    }),
    usuario2Id: joi.string().uuid().required().messages({
        'string.uuid': 'O ID do segundo usuário é inválido.',
        'any.required': 'O ID do segundo usuário é obrigatório.',
    }), 
});

export { createContaConjuntaSchema };