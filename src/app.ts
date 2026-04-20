import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { router } from "./routers/mainRouter";

const app = express();

app.use(express.json());
app.use(cors());
app.use(router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof Error) {
    return res.status(400).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Erro interno no servidor.",
  });
});

export { app };
