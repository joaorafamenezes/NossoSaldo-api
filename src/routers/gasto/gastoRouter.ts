import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";
import { gastoController } from "../../controllers/gasto/gastoController";
import { createGastoSchema } from "../../schemas/gasto/createGastoSchema";
import { pagarGastoSchema } from "../../schemas/gasto/pagarGastoSchema";
import { updateGastoSchema } from "../../schemas/gasto/updateGastoSchema";

const gastoRouter = Router();

gastoRouter.get("/gastos/total/mes-atual", validarToken, (req: Request, res: Response, next: NextFunction) => {
    gastoController.buscarTotalGastoMesAtual(req, res, next).catch(next);
});

gastoRouter.get("/gastos", validarToken, (req: Request, res: Response, next: NextFunction) => {
    gastoController.listarGastosPorUsuarioLogado(req, res, next).catch(next);
});

gastoRouter.get("/gastos/:id", validarToken, (req: Request, res: Response, next: NextFunction) => {
    gastoController.detalharGasto(req, res, next).catch(next);
});

gastoRouter.post("/gastosUsuarioLogado", validarToken, validateUser(createGastoSchema), (req: Request, res: Response, next: NextFunction) => {
    gastoController.criarGastoUsuarioLogado(req, res, next).catch(next);
});

gastoRouter.patch("/gastos/:id", validarToken, validateUser(updateGastoSchema), (req: Request, res: Response, next: NextFunction) => {
    gastoController.atualizarGasto(req, res, next).catch(next);
});

gastoRouter.patch("/pagarGastos/:id/pagamento", validarToken, validateUser(pagarGastoSchema), (req: Request, res: Response, next: NextFunction) => {
    gastoController.pagarGasto(req, res, next).catch(next);
});

gastoRouter.delete("/gastos/:id", validarToken, (req: Request, res: Response, next: NextFunction) => {
    gastoController.deletarGasto(req, res, next).catch(next);
});

export { gastoRouter };
