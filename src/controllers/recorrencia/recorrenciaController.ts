import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";
import { sendSuccess } from "../../http/response";
import { recorrenciaService } from "../../services/recorrencia/recorrenciaService";
import { iFiltroRecorrencias } from "../../@types/recorrencia/iRecorrencia";

export class RecorrenciaController {
  async criarRecorrencia(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const resultado = await recorrenciaService.criarRecorrencia(req.body, payload.id);
      return sendSuccess(res, StatusCodes.CREATED, resultado);
    } catch (error) {
      return next(error);
    }
  }

  async detalharRecorrencia(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payload = res.locals.payload as Token;
      const resultado = await recorrenciaService.buscarRecorrenciaPorId(id, payload.id);
      return sendSuccess(res, StatusCodes.OK, resultado);
    } catch (error) {
      return next(error);
    }
  }

  async listarRecorrencias(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const filtros: iFiltroRecorrencias = {
        status: req.query.status as any,
        tipo: req.query.tipo as any,
        categoriaId: req.query.categoriaId as any,
      };

      const resultado = await recorrenciaService.listarRecorrenciasPorUsuario(payload.id, filtros);
      return sendSuccess(res, StatusCodes.OK, resultado, { total: resultado.length });
    } catch (error) {
      return next(error);
    }
  }

  async atualizarRecorrencia(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payload = res.locals.payload as Token;
      const resultado = await recorrenciaService.atualizarRecorrencia(id, req.body, payload.id);
      return sendSuccess(res, StatusCodes.OK, resultado);
    } catch (error) {
      return next(error);
    }
  }

  async pausarRecorrencia(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payload = res.locals.payload as Token;
      const resultado = await recorrenciaService.pausarRecorrencia(id, req.body, payload.id);
      return sendSuccess(res, StatusCodes.OK, resultado);
    } catch (error) {
      return next(error);
    }
  }

  async retomarRecorrencia(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payload = res.locals.payload as Token;
      const resultado = await recorrenciaService.retomarRecorrencia(id, payload.id);
      return sendSuccess(res, StatusCodes.OK, resultado);
    } catch (error) {
      return next(error);
    }
  }

  async deletarRecorrencia(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payload = res.locals.payload as Token;
      const resultado = await recorrenciaService.deletarRecorrencia(id, payload.id);
      return sendSuccess(res, StatusCodes.OK, resultado);
    } catch (error) {
      return next(error);
    }
  }
}

export const recorrenciaController = new RecorrenciaController();
