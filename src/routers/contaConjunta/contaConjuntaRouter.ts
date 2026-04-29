import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";
import { contaConjuntaController } from "../../controllers/contaConjunta/contaConjuntaController";
import { createContaConjuntaSchema } from "../../schemas/contaConjunta/createContaConjuntaSchema";

const contaConjuntaRouter = Router();

contaConjuntaRouter.get("/conta-conjunta", validarToken, (req: Request, res: Response, next: NextFunction) => {
    contaConjuntaController.listarContasConjuntasPorUsuarioId(req, res, next).catch(next);
});

contaConjuntaRouter.post("/criarContaConjunta", validarToken, validateUser(createContaConjuntaSchema), (req: Request, res: Response, next: NextFunction) => {
    contaConjuntaController.criarContaConjunta(req, res, next).catch(next);
});

export { contaConjuntaRouter };
