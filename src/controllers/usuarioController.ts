import { NextFunction, Request, Response } from "express";
import { usuarioService } from '../services/usuarioService';
import iCriarUsuarioSchema from "../@types/iCriarUsuarioSchema";

class UsuarioController {

    async criarUsuario(req: Request, res: Response, next: NextFunction) {
        try {
            
            const data: iCriarUsuarioSchema = req.body;
            const usuarioCriado = await usuarioService.criarUsuario(data);
            res.status(201).json(usuarioCriado);

        } catch (error) {
            return next(error);
        }
    }
}

export const usuarioControler = new UsuarioController();