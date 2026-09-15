import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";
import { recorrenciaController } from "../../controllers/recorrencia/recorrenciaController";
import {
  createRecorrenciaSchema,
  updateRecorrenciaSchema,
  pausarRecorrenciaSchema,
} from "../../schemas/recorrencia/recorrenciaSchemas";

const recorrenciaRouter = Router();

recorrenciaRouter.get("/recorrencias", validarToken, (req: Request, res: Response, next: NextFunction) => {
  recorrenciaController.listarRecorrencias(req, res, next).catch(next);
});

recorrenciaRouter.get("/recorrencias/:id", validarToken, (req: Request, res: Response, next: NextFunction) => {
  recorrenciaController.detalharRecorrencia(req, res, next).catch(next);
});

recorrenciaRouter.post(
  "/recorrencias",
  validarToken,
  validateUser(createRecorrenciaSchema),
  (req: Request, res: Response, next: NextFunction) => {
    recorrenciaController.criarRecorrencia(req, res, next).catch(next);
  }
);

recorrenciaRouter.patch(
  "/recorrencias/:id",
  validarToken,
  validateUser(updateRecorrenciaSchema),
  (req: Request, res: Response, next: NextFunction) => {
    recorrenciaController.atualizarRecorrencia(req, res, next).catch(next);
  }
);

recorrenciaRouter.patch(
  "/recorrencias/:id/pausar",
  validarToken,
  validateUser(pausarRecorrenciaSchema),
  (req: Request, res: Response, next: NextFunction) => {
    recorrenciaController.pausarRecorrencia(req, res, next).catch(next);
  }
);

recorrenciaRouter.patch(
  "/recorrencias/:id/retomar",
  validarToken,
  (req: Request, res: Response, next: NextFunction) => {
    recorrenciaController.retomarRecorrencia(req, res, next).catch(next);
  }
);

recorrenciaRouter.delete(
  "/recorrencias/:id",
  validarToken,
  (req: Request, res: Response, next: NextFunction) => {
    recorrenciaController.deletarRecorrencia(req, res, next).catch(next);
  }
);

export { recorrenciaRouter };
