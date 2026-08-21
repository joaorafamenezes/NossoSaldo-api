import { Router } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";
import { consultarIaSchema } from "../../schemas/ia/consultarIaSchema";
import { configurarIaSchema } from "../../schemas/ia/configurarIaSchema";
import { iaController } from "../../controllers/ia/iaController";

const iaRouter = Router();

iaRouter.get("/ia/configuracao", validarToken, (req, res, next) => iaController.status(req, res, next));

iaRouter.put(
  "/ia/configuracao",
  validarToken,
  validateUser(configurarIaSchema),
  (req, res, next) => iaController.configurar(req, res, next),
);

iaRouter.delete("/ia/configuracao", validarToken, (req, res, next) => iaController.remover(req, res, next));

iaRouter.get("/ia/consultas/historico", validarToken, (req, res, next) => iaController.historico(req, res, next));

iaRouter.delete("/ia/consultas/historico", validarToken, (req, res, next) => iaController.removerHistorico(req, res, next));

iaRouter.post(
  "/ia/consultas",
  validarToken,
  validateUser(consultarIaSchema),
  (req, res, next) => iaController.consultar(req, res, next),
);

export { iaRouter };
