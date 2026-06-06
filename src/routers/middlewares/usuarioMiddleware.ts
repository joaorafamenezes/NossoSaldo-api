import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { createValidationError } from "../../errors/httpError";

function validateSource<TSchema>(schema: Joi.ObjectSchema<TSchema>, source: "body" | "params" | "query") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(createValidationError(errorMessages));
    }

    req[source] = value;

    return next();
  };
}

function validateCreateUser<TSchema>(schema: Joi.ObjectSchema<TSchema>) {
  return validateSource(schema, "body");
}

const validateUser = validateCreateUser;
const validateParams = <TSchema>(schema: Joi.ObjectSchema<TSchema>) => validateSource(schema, "params");
const validateQuery = <TSchema>(schema: Joi.ObjectSchema<TSchema>) => validateSource(schema, "query");

export {
  validateCreateUser,
  validateParams,
  validateQuery,
  validateUser,
};
