import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import auth from "../../secure/authorization";

export default async function validarToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers["x-access-token"] as string;

    if (!token) {
      return next(createHttpError(401, "Token não fornecido"));
    }

    const payload = await auth.verifyToken(token);

    if (!payload) {
      return next(createHttpError(401, "Token inválido"));
    }

    res.locals.payload = payload;

    return next();
  } catch (error) {
    return next(error);
  }
}
