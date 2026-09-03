import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import auth, { Token } from "../../secure/authorization";

export default async function validarToken(req: Request, res: Response, next: NextFunction) {
  try {
    const rawAuth = req.headers["authorization"];
    const token = (req.headers["x-access-token"] as string) || (typeof rawAuth === "string" ? rawAuth.replace(/^Bearer\s+/i, "") : "");

    if (!token) {
      return next(createHttpError(401, "Token não fornecido"));
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
      return next(createHttpError(401, "Token inválido"));
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

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const payload = res.locals.payload as Token | undefined;

  if (!payload || payload.perfil !== "ADMIN") {
    return next(createHttpError(403, "Acesso negado: recurso restrito a administradores do sistema."));
  }

  return next();
}
