import { NextFunction, Request, Response } from "express";
import { categoriaService } from '../../services/categoria/categoriaService';
import iCriarCategoria from "../../@types/categoria/iCriarCategoria";
import { StatusCodes } from 'http-status-codes';

class CategoriaController {
    async criarCategoria(req: Request, res: Response, next: NextFunction) {
        try {
            const data: iCriarCategoria = req.body;
            const categoriaCriada = await categoriaService.criarCategoria(data);
            res.status(StatusCodes.CREATED).json(categoriaCriada);
        } catch (error) {
            return next(error);
        }
    }    

    async buscarTodasCategorias(req: Request, res: Response, next: NextFunction) {
        try {
            const categorias = await categoriaService.buscarTodasCategorias();
            res.status(StatusCodes.OK).json(categorias);
        } catch (error) {
            return next(error);
        }
    }
}

export const categoriaController = new CategoriaController();