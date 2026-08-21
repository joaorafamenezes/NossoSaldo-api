import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendSuccess } from "../../http/response";
import { Token } from "../../secure/authorization";
import { iaService } from "../../services/ia/iaService";

class IaController {
  async configurar(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const resultado = await iaService.configurar(payload.id, req.body.apiKey, req.body.modelo);
      return sendSuccess(res, StatusCodes.OK, resultado);
    } catch (error) {
      return next(error);
    }
  }

  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      return sendSuccess(res, StatusCodes.OK, await iaService.status(payload.id));
    } catch (error) {
      return next(error);
    }
  }

  async remover(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      return sendSuccess(res, StatusCodes.OK, await iaService.removerConfiguracao(payload.id));
    } catch (error) {
      return next(error);
    }
  }

  async historico(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      return sendSuccess(res, StatusCodes.OK, await iaService.listarHistorico(payload.id));
    } catch (error) {
      return next(error);
    }
  }

  async removerHistorico(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      return sendSuccess(res, StatusCodes.OK, await iaService.removerHistorico(payload.id));
    } catch (error) {
      return next(error);
    }
  }

  async consultar(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const resultado = await iaService.consultar(req.body.pergunta, payload.id);

      return sendSuccess(res, StatusCodes.OK, resultado);
    } catch (error) {
      return next(error);
    }
  }
}

export const iaController = new IaController();
