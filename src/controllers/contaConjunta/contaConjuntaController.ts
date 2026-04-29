import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";
import { contaConjuntaService } from "../../services/contaConjunta/contaConjuntaService";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";

class ContaConjuntaController {
  async criarContaConjunta(req: Request, res: Response, next: NextFunction) {
    try {
        const data: iCriarContaConjunta = req.body;
        const contaConjuntaCriada = await contaConjuntaService.criarContaConjunta(data);
        return res.status(StatusCodes.CREATED).json(contaConjuntaCriada); 
    } catch (error) {
      return next(error);
    }
  }

  async listarContasConjuntasPorUsuarioId(req: Request, res: Response, next: NextFunction) {
    try {
        const payload = res.locals.payload as Token;
        const contasConjuntas = await contaConjuntaService.listarContasConjuntasPorUsuarioId(payload.id);
        return res.status(StatusCodes.OK).json(contasConjuntas); 
    } catch (error) {
      return next(error);
    }
  }
}

export const contaConjuntaController = new ContaConjuntaController();
