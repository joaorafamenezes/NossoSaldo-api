import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { usuarioService } from "../../services/usuario/usuarioService";
import iCriarUsuarioSchema from "../../@types/usuario/iCriarUsuario";
import iLogin from "../../@types/iLogin";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";
import iAtualizaUsuarioSchema from "../../@types/usuario/iAtualizaUsuario";
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
