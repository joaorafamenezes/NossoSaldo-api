import { NextFunction, Request, Response } from "express";
import { categoriaService } from '../../services/categoria/categoriaService';
import iCriarCategoria from "../../@types/categoria/iCriarCategoria";
import { StatusCodes } from 'http-status-codes';
import { sendSuccess } from "../../http/response";

class CategoriaController {
    async criarCategoria(req: Request, res: Response, next: NextFunction) {
        try {
            const data: iCriarCategoria = req.body;
            const categoriaCriada = await categoriaService.criarCategoria(data);
            return sendSuccess(res, StatusCodes.CREATED, categoriaCriada);
        } catch (error) {
            return next(error);
        }
    }    

    async buscarTodasCategorias(req: Request, res: Response, next: NextFunction) {
        try {
            const categorias = await categoriaService.buscarTodasCategorias();
            return sendSuccess(res, StatusCodes.OK, categorias, {
                total: categorias.length,
            });
        } catch (error) {
            return next(error);
        }
    }

    async atualizarCategoria(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const data: Partial<iCriarCategoria> = req.body;
            const categoriaAtualizada = await categoriaService.atualizarCategoria(id, data);
            return sendSuccess(res, StatusCodes.OK, categoriaAtualizada);
        } catch (error) {
            return next(error);
        }
    }

    async deletarCategoria(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            await categoriaService.deletarCategoria(id);
            return sendSuccess(res, StatusCodes.OK, { mensagem: "Categoria excluida com sucesso." });
        } catch (error) {
            return next(error);
        }
    }
}

export const categoriaController = new CategoriaController();
