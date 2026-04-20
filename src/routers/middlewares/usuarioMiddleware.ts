import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import iCriarUsuarioSchema from "../../@types/iCriarUsuario";

function validateCreateUser(schema: Joi.ObjectSchema<iCriarUsuarioSchema>) {
    return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({ errors: errorMessages });
    }

    req.body = value;

    next();
  }
}

export {
    validateCreateUser
}