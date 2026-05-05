import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { isHttpError } from "http-errors";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openapi";
import { httpLogger } from "./lib/logger";
import { router } from "./routers/mainRouter";

const app = express();

function resolveErrorCode(err: unknown, statusCode: number) {
  if (isHttpError(err) && "code" in err && typeof err.code === "string") {
    return err.code;
  }

  const defaultCodesByStatus: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    500: "INTERNAL_SERVER_ERROR",
  };

  return defaultCodesByStatus[statusCode] ?? "REQUEST_ERROR";
}

app.use(express.json());
app.use(cors());
app.use(httpLogger);
app.get("/docs/openapi.json", (_req: Request, res: Response) => {
  res.json(openApiSpec);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use(router);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err as Error);
  }

  const statusCode = isHttpError(err) ? err.statusCode : 500;
  const requestId = req.id;
  const errorCode = resolveErrorCode(err, statusCode);

  req.log?.error(
    {
      err,
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorCode,
    },
    "Unhandled request error",
  );

  if (statusCode >= 500) {
    return res.status(statusCode).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno no servidor.",
      },
      requestId,
    });
  }

  const responseBody: Record<string, unknown> = {
    error: {
      code: errorCode,
      message: isHttpError(err) ? err.message : "Erro na requisicao.",
    },
    requestId,
  };

  if (isHttpError(err) && "details" in err) {
    responseBody.error = {
      ...(responseBody.error as Record<string, unknown>),
      details: err.details,
    };
  }

  return res.status(statusCode).json(responseBody);
});

export { app };
