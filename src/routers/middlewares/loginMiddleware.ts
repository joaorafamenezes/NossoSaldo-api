import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import auth from "../../secure/authorization";

export default async function validarToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers["x-access-token"] as string;

    if (!token) {
      return next(createHttpError(401, "Token nÃƒÂ£o fornecido"));
    }

    const result = await auth.verifyToken(token);
    const diagnostics = auth.getJwtDiagnostics();
    const tokenSample = auth.tokenPrefix(token);

    if (result.error === "expired") {
      req.log?.warn(
        {
          requestId: req.id,
          tokenPrefix: tokenSample,
          authStatus: "expired",
          ...diagnostics,
        },
        "JWT rejected during request authentication",
      );
      return next(createHttpError(401, "Token expirado"));
    }

    if (result.error === "invalid" || !result.payload) {
      req.log?.warn(
        {
          requestId: req.id,
          tokenPrefix: tokenSample,
          authStatus: "invalid",
          ...diagnostics,
        },
        "JWT rejected during request authentication",
      );
      return next(createHttpError(401, "Token invÃƒÂ¡lido"));
    }

    req.log?.info(
      {
        requestId: req.id,
        tokenPrefix: tokenSample,
        authStatus: "valid",
        userId: result.payload.id,
        ...diagnostics,
      },
      "JWT accepted during request authentication",
    );

    res.locals.payload = result.payload;

    return next();
  } catch (error) {
    return next(error);
  }
}
