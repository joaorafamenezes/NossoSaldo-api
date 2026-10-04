import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { releaseController } from "../../controllers/release/releaseController";

const releaseRouter = Router();

releaseRouter.get("/releases/status", validarToken, (req: Request, res: Response, next: NextFunction) => {
  releaseController.obterStatus(req, res, next).catch(next);
});

releaseRouter.post("/releases/mark-viewed", validarToken, (req: Request, res: Response, next: NextFunction) => {
  releaseController.marcarVisualizada(req, res, next).catch(next);
});

export { releaseRouter };
