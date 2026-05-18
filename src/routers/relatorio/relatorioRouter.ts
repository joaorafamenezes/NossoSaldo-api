import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { relatorioController } from "../../controllers/relatorio/relatorioController";

const relatorioRouter = Router();

relatorioRouter.get('/relatorio/evolucaoMensal/:de/:ate', validarToken, (req: Request, res: Response, next: NextFunction) => {
    relatorioController.gerarRelatorioEvolucaoMensal(req, res, next).catch(next);
});
relatorioRouter.get('/relatorio/comparativoMensal/:mesAtual/:mesAnterior', validarToken, (req: Request, res: Response, next: NextFunction) => {
    relatorioController.gerarRelatorioComparativoMensal(req, res, next).catch(next);
});
relatorioRouter.get('/relatorio/topCategoria/:de/:ate', validarToken, (req: Request, res: Response, next: NextFunction) => {
    relatorioController.gerarRelatorioTopCategoria(req, res, next).catch(next);
});
relatorioRouter.get('/relatorio/quemGastaMais/:de/:ate', validarToken, (req: Request, res: Response, next: NextFunction) => {
    relatorioController.gerarRelatorioQuemGastaMais(req, res, next).catch(next);
});

export { relatorioRouter };
