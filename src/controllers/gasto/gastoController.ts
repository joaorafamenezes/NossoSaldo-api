import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";
import { gastoService } from "../../services/gasto/gastoService";
import iPagarGasto from "../../@types/gasto/iPagarGasto";
import { sendSuccess } from "../../http/response";

class GastoController {
    async buscarTotalGastoMesAtual(req: Request, res: Response, next: NextFunction) {
        try {
            const payload = res.locals.payload as Token;
            const total = await gastoService.buscarTotalGastoMesAtualPorResponsavelId(payload.id);
            return sendSuccess(res, StatusCodes.OK, total);
        } catch (error) {
            return next(error);
        }
    }

    async listarGastosPorUsuarioLogado(req: Request, res: Response, next: NextFunction) {
        try {
            const payload = res.locals.payload as Token;

            const gastos = await gastoService.listarGastosPorResponsavelId(payload.id);            
            return sendSuccess(res, StatusCodes.OK, gastos, {
                total: gastos.length,
            });
        } catch (error) {
            return next(error);
        }
    }

    async detalharGasto(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const payload = res.locals.payload as Token;
            const gasto = await gastoService.detalharGastoPorId(id, payload.id);
            return sendSuccess(res, StatusCodes.OK, gasto);
        } catch (error) {
            return next(error);
        }
    }

    async criarGastoUsuarioLogado(req: Request, res: Response, next: NextFunction) {
        try {
            const payload = res.locals.payload as Token;
            const gastoData = req.body as iCriarGasto;
            gastoData.responsavelId = payload.id;

            const gastoCriado = await gastoService.criarGastoUsuarioLogado(gastoData);
            return sendSuccess(res, StatusCodes.CREATED, gastoCriado);
        } catch (error) {
            return next(error);
        }
    }

    async atualizarGasto(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const payload = res.locals.payload as Token;
            const gastoData = req.body as iAtualizarGasto;

            const gastoAtualizado = await gastoService.atualizarGasto(id, gastoData, payload.id);
            return sendSuccess(res, StatusCodes.OK, gastoAtualizado);
        } catch (error) {
            return next(error);
        }
    }

    async pagarGasto(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const payload = res.locals.payload as Token;
            const pagamentoData = req.body as iPagarGasto;

            const gastoPago = await gastoService.pagarGasto(id, pagamentoData, payload.id);
            return sendSuccess(res, StatusCodes.OK, gastoPago);
        } catch (error) {
            return next(error);
        }
    }

    async pagarParcela(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const payload = res.locals.payload as Token;
            const pagamentoData = req.body as iPagarGasto;

            const parcelaPaga = await gastoService.pagarParcela(id, pagamentoData, payload.id);
            return sendSuccess(res, StatusCodes.OK, parcelaPaga);
        } catch (error) {
            return next(error);
        }
    }

    async deletarGasto(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const payload = res.locals.payload as Token;

            const resultado = await gastoService.deletarGasto(id, payload.id);
            return sendSuccess(res, StatusCodes.OK, resultado);
        } catch (error) {
            return next(error);
        }
    }
}

export const gastoController = new GastoController();
