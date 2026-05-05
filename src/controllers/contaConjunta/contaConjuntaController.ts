import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";
import { contaConjuntaService } from "../../services/contaConjunta/contaConjuntaService";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";
import { sendSuccess } from "../../http/response";

class ContaConjuntaController {
  async criarContaConjunta(req: Request, res: Response, next: NextFunction) {
    try {
        const payload = res.locals.payload as Token;
        const data: iCriarContaConjunta = req.body;

        const contaConjuntaCriada = await contaConjuntaService.criarContaConjunta(data, payload.id);
        return sendSuccess(res, StatusCodes.CREATED, contaConjuntaCriada); 
    } catch (error) {
      return next(error);
    }
  }

  async listarContasConjuntasPorUsuarioId(req: Request, res: Response, next: NextFunction) {
    try {
        const payload = res.locals.payload as Token;
        const contasConjuntas = await contaConjuntaService.listarContasConjuntasPorUsuarioId(payload.id);
        return sendSuccess(res, StatusCodes.OK, contasConjuntas, {
          total: contasConjuntas.length,
        }); 
    } catch (error) {
      return next(error);
    }
  }
}

export const contaConjuntaController = new ContaConjuntaController();
