import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";
import { categoriaController } from "../../controllers/categoria/categoriaController";
import { createCategoriaSchema } from "../../schemas/categoria/createCategoriaSchema";

const categoriaRouter = Router();

categoriaRouter.get("/categorias", validarToken, (req: Request, res: Response, next: NextFunction) => {
    categoriaController.buscarTodasCategorias(req, res, next).catch(next);
});

categoriaRouter.post("/categoria", validarToken, validateUser(createCategoriaSchema), (req: Request, res: Response, next: NextFunction) => {
    categoriaController.criarCategoria(req, res, next).catch(next);
});

export { categoriaRouter };
