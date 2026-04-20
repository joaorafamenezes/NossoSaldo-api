import { NextFunction, Request, Response } from "express";
import { usuarioService } from '../services/usuarioService';
import iCriarUsuarioSchema from "../@types/iCriarUsuario";
import iLogin from "../@types/iLogin";
import { StatusCodes } from 'http-status-codes';

class UsuarioController {

    async criarUsuario(req: Request, res: Response, next: NextFunction) {
        try {            
            const data: iCriarUsuarioSchema = req.body;
            const usuarioCriado = await usuarioService.criarUsuario(data);
            res.status(StatusCodes.CREATED).json(usuarioCriado);

        } catch (error) {
            return next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction){
        try {
            const data: iLogin = req.body;
            const usuarioLogado = await usuarioService.login(data);

            if(usuarioLogado){
                return res.status(StatusCodes.OK).json({
                    auth: true,
                    ...usuarioLogado
                });    
            }

            return res.status(StatusCodes.UNAUTHORIZED).json({
                auth: false,
                message: "Login ou senha incorretos"
            });


        } catch (error) {
            return next(error);
        }
    }
}

export const usuarioControler = new UsuarioController();
