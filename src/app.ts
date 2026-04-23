import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { isHttpError } from "http-errors";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/openapi";
import { httpLogger } from "./lib/logger";
import { router } from "./routers/mainRouter";

const app = express();

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

  req.log?.error(
    {
      err,
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
    },
    "Unhandled request error",
  );

  if (statusCode >= 500) {
    return res.status(statusCode).json({
      status: "error",
      message: "Erro interno no servidor.",
      requestId,
    });
  }

  const responseBody: Record<string, unknown> = {
    status: "error",
    message: isHttpError(err) ? err.message : "Erro na requisição.",
    requestId,
  };

  if (isHttpError(err) && "details" in err) {
    responseBody.details = err.details;
  }

  return res.status(statusCode).json(responseBody);
});

export { app };
