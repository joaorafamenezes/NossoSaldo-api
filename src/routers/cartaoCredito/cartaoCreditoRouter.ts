import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { cartaoCreditoController } from "../../controllers/cartaoCredito/cartaoCreditoController";
import { createCartaoCreditoSchema } from "../../schemas/cartaoCredito/createCartaoCreditoSchema";
import { updateCartaoCreditoSchema } from "../../schemas/cartaoCredito/updateCartaoCreditoSchema";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";

const cartaoCreditoRouter = Router();

cartaoCreditoRouter.get("/cartoesCredito", validarToken, (req: Request, res: Response, next: NextFunction) => {
  cartaoCreditoController.listarCartoesCredito(req, res, next).catch(next);
});

cartaoCreditoRouter.post("/cartoesCredito", validarToken, validateUser(createCartaoCreditoSchema), (req: Request, res: Response, next: NextFunction) => {
  cartaoCreditoController.criarCartaoCredito(req, res, next).catch(next);
});

cartaoCreditoRouter.patch("/cartoesCredito/:id", validarToken, validateUser(updateCartaoCreditoSchema), (req: Request, res: Response, next: NextFunction) => {
  cartaoCreditoController.atualizarCartaoCredito(req, res, next).catch(next);
});

export { cartaoCreditoRouter };
