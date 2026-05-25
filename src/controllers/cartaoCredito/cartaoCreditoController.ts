import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import createHttpError from "http-errors";
import iCriarCartaoCredito from "../../@types/cartaoCredito/iCriarCartaoCredito";
import { sendSuccess } from "../../http/response";
import { cartaoCreditoService } from "../../services/cartaoCredito/cartaoCreditoService";

class CartaoCreditoController {
  async criarCartaoCredito(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = res.locals.payload?.id;

      if (!usuarioId) {
        return next(createHttpError(401, "Usuario autenticado nao identificado."));
      }

      const data: iCriarCartaoCredito = req.body;
      const cartaoCriado = await cartaoCreditoService.criarCartaoCredito(usuarioId, data);
      return sendSuccess(res, StatusCodes.CREATED, cartaoCriado);
    } catch (error) {
      return next(error);
    }
  }

  async listarCartoesCredito(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = res.locals.payload?.id;

      if (!usuarioId) {
        return next(createHttpError(401, "Usuario autenticado nao identificado."));
      }

      const cartoes = await cartaoCreditoService.listarCartoesCreditoPorUsuario(usuarioId);
      return sendSuccess(res, StatusCodes.OK, cartoes, {
        total: cartoes.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async atualizarCartaoCredito(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = res.locals.payload?.id;

      if (!usuarioId) {
        return next(createHttpError(401, "Usuario autenticado nao identificado."));
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data: iCriarCartaoCredito = req.body;
      const cartaoAtualizado = await cartaoCreditoService.atualizarCartaoCredito(id, usuarioId, data);
      return sendSuccess(res, StatusCodes.OK, cartaoAtualizado);
    } catch (error) {
      return next(error);
    }
  }
}

export const cartaoCreditoController = new CartaoCreditoController();
