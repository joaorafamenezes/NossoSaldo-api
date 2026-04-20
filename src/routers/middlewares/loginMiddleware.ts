import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import auth from "../../secure/authorization";

export default async function validateLogin(req: Request, res: Response, next: NextFunction) {
  try {
    
    const token = req.headers['x-access-token'] as string;
    
    if(!token) return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Token não fornecido",
    });

    const payload = await auth.verifyToken(token);

    if(!payload) return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Token inválido",
    });

    req.body.payload = payload;

    next();

  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Token inválido",
    });
  }
}
