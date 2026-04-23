import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { createValidationError } from "../../errors/httpError";

function validateCreateUser<TSchema>(schema: Joi.ObjectSchema<TSchema>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(createValidationError(errorMessages));
    }

    req.body = value;

    return next();
  };
}

const validateUser = validateCreateUser;

export {
  validateCreateUser,
  validateUser,
};
