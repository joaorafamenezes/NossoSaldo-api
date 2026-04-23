import { randomUUID } from "crypto";
import pino from "pino";
import pinoHttp from "pino-http";

const isTestEnvironment = process.env.NODE_ENV === "test";
const isProductionEnvironment = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isTestEnvironment ? "silent" : "info"),
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isProductionEnvironment || isTestEnvironment
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existingRequestId = req.headers["x-request-id"];
    const requestId = typeof existingRequestId === "string" && existingRequestId.trim().length > 0
      ? existingRequestId
      : randomUUID();

    res.setHeader("x-request-id", requestId);

    return requestId;
  },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} concluded with ${res.statusCode}`,
  customErrorMessage: (req, res) => `${req.method} ${req.url} failed with ${res.statusCode}`,
});
