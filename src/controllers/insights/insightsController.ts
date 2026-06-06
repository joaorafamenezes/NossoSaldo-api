import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendSuccess } from "../../http/response";
import { Token } from "../../secure/authorization";
import { insightsService } from "../../services/insights/insightsService";

class InsightsController {
  async gerarInsightsGargalos(req: Request, res: Response, next: NextFunction) {
    try {
      const de = req.params.de as string;
      const ate = req.params.ate as string;
      const payload = res.locals.payload as Token;

      if (ate < de) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: {
            code: "BAD_REQUEST",
            message: "O parametro 'ate' deve ser maior ou igual ao parametro 'de'.",
          },
        });
      }

      const insights = await insightsService.gerarInsightsGargalos(de, ate, payload.id);

      return sendSuccess(res, StatusCodes.OK, insights);
    } catch (error) {
      return next(error);
    }
  }
}

export const insightsController = new InsightsController();
