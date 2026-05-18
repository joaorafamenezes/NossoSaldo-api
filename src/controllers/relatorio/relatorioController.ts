import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendSuccess } from "../../http/response";
import { relatorioService } from "../../services/relatorio/relatorioService";
import { Token } from "../../secure/authorization";

class RelatorioController {
    async gerarRelatorioEvolucaoMensal(req: Request, res: Response, next: NextFunction) {
        try {
            const de = req.params.de as string;
            const ate = req.params.ate as string;
            const payload = res.locals.payload as Token;

            if (ate < de) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: {
                        code: "BAD_REQUEST",
                        message: "O parametro 'ate' deve ser maior ou igual ao parametro 'de'."
                    }
                });
            }

            const relatorio = await relatorioService.gerarRelatorioEvolucaoMensal(de, ate, payload.id);

            return sendSuccess(res, StatusCodes.OK, relatorio);
        } catch (error) {
            return next(error);
        }
    }

    async gerarRelatorioComparativoMensal(req: Request, res: Response, next: NextFunction) {
        try {
            const mesAtual = req.params.mesAtual as string;
            const mesAnterior = req.params.mesAnterior as string;
            const payload = res.locals.payload as Token;

            if (mesAtual < mesAnterior) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: {
                        code: "BAD_REQUEST",
                        message: "O parametro 'mesAtual' deve ser maior ou igual ao parametro 'mesAnterior'."
                    }
                });
            }

            const relatorio = await relatorioService.gerarRelatorioComparativoMensal(mesAtual, mesAnterior, payload.id);

            return sendSuccess(res, StatusCodes.OK, relatorio);
        } catch (error) {
            return next(error);
        }
    }

    async gerarRelatorioTopCategoria(req: Request, res: Response, next: NextFunction) {
        try {
            const de = req.params.de as string;
            const ate = req.params.ate as string;
            const payload = res.locals.payload as Token;

            if (ate < de) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: {
                        code: "BAD_REQUEST",
                        message: "O parametro 'ate' deve ser maior ou igual ao parametro 'de'."
                    }
                });
            }

            const relatorio = await relatorioService.gerarRelatorioTopCategoria(de, ate, payload.id);

            return sendSuccess(res, StatusCodes.OK, relatorio);
        } catch (error) {
            return next(error);
        }
    }

    async gerarRelatorioQuemGastaMais(req: Request, res: Response, next: NextFunction) {
        try {
            const de = req.params.de as string;
            const ate = req.params.ate as string;
            const payload = res.locals.payload as Token;

            if (ate < de) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    error: {
                        code: "BAD_REQUEST",
                        message: "O parametro 'ate' deve ser maior ou igual ao parametro 'de'."
                    }
                });
            }

            const relatorio = await relatorioService.gerarRelatorioQuemGastaMais(de, ate, payload.id);

            return sendSuccess(res, StatusCodes.OK, relatorio);
        } catch (error) {
            return next(error);
        }
    }

}

export const relatorioController = new RelatorioController();
