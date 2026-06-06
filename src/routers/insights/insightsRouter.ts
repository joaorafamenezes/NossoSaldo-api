import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { validateParams } from "../middlewares/usuarioMiddleware";
import { getInsightsSchema } from "../../schemas/insights/getInsightsSchema";
import { insightsController } from "../../controllers/insights/insightsController";

const insightsRouter = Router();

insightsRouter.get(
  "/insights/gargalos/:de/:ate",
  validarToken,
  validateParams(getInsightsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    insightsController.gerarInsightsGargalos(req, res, next).catch(next);
  },
);

export { insightsRouter };
