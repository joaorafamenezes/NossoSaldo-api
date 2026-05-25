import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";
import { sendSuccess } from "../../http/response";
import { faturaCartaoService } from "../../services/faturaCartao/faturaCartaoService";
import iPagarGasto from "../../@types/gasto/iPagarGasto";

class FaturaCartaoController {
  async listarFaturas(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const cartaoCreditoId = typeof req.query.cartaoCreditoId === "string"
        ? req.query.cartaoCreditoId
        : undefined;

      const faturas = await faturaCartaoService.listarFaturasPorUsuario(payload.id, cartaoCreditoId);
      return sendSuccess(res, StatusCodes.OK, faturas, {
        total: faturas.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async pagarFatura(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = res.locals.payload as Token;
      const pagamentoData = req.body as iPagarGasto;

      const faturaPaga = await faturaCartaoService.pagarFatura(id, pagamentoData, payload.id);
      return sendSuccess(res, StatusCodes.OK, faturaPaga);
    } catch (error) {
      return next(error);
    }
  }

  async reabrirFatura(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const payload = res.locals.payload as Token;

      const faturaReaberta = await faturaCartaoService.reabrirFatura(id, payload.id);
      return sendSuccess(res, StatusCodes.OK, faturaReaberta);
    } catch (error) {
      return next(error);
    }
  }
}

export const faturaCartaoController = new FaturaCartaoController();
