import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import validarToken from "../middlewares/loginMiddleware";
import { validateUser } from "../middlewares/usuarioMiddleware";
import { categoriaController } from "../../controllers/categoria/categoriaController";
import { createCategoriaSchema } from "../../schemas/categoria/createCategoriaSchema";
import { updateCategoriaSchema } from "../../schemas/categoria/updateCategoriaSchema";

const categoriaRouter = Router();

categoriaRouter.get("/categorias", validarToken, (req: Request, res: Response, next: NextFunction) => {
    categoriaController.buscarTodasCategorias(req, res, next).catch(next);
});

categoriaRouter.post("/categorias", validarToken, validateUser(createCategoriaSchema), (req: Request, res: Response, next: NextFunction) => {
    categoriaController.criarCategoria(req, res, next).catch(next);
});

categoriaRouter.patch("/categorias/:id", validarToken, validateUser(updateCategoriaSchema), (req: Request, res: Response, next: NextFunction) => {
    categoriaController.atualizarCategoria(req, res, next).catch(next);
});

categoriaRouter.delete("/categorias/:id", validarToken, (req: Request, res: Response, next: NextFunction) => {
    categoriaController.deletarCategoria(req, res, next).catch(next);
});

export { categoriaRouter };
