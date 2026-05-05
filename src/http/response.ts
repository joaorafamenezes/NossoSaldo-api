import { Response } from "express";

type SuccessMeta = Record<string, unknown>;

export function sendSuccess<T>(res: Response, statusCode: number, data: T, meta?: SuccessMeta) {
  const responseBody: { data: T; meta?: SuccessMeta } = { data };

  if (meta && Object.keys(meta).length > 0) {
    responseBody.meta = meta;
  }

  return res.status(statusCode).json(responseBody);
}
