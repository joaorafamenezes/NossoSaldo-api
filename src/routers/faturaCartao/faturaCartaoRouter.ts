import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { faturaCartaoController } from "../../controllers/faturaCartao/faturaCartaoController";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";
import { pagarGastoSchema } from "../../schemas/gasto/pagarGastoSchema";

const faturaCartaoRouter = Router();

faturaCartaoRouter.get("/faturasCartao", validarToken, (req: Request, res: Response, next: NextFunction) => {
  faturaCartaoController.listarFaturas(req, res, next).catch(next);
});

faturaCartaoRouter.patch("/faturasCartao/:id/pagamento", validarToken, validateUser(pagarGastoSchema), (req: Request, res: Response, next: NextFunction) => {
  faturaCartaoController.pagarFatura(req, res, next).catch(next);
});

faturaCartaoRouter.patch("/faturasCartao/:id/reabertura", validarToken, (req: Request, res: Response, next: NextFunction) => {
  faturaCartaoController.reabrirFatura(req, res, next).catch(next);
});

export { faturaCartaoRouter };
