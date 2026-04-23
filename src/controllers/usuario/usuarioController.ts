import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { usuarioService } from "../../services/usuario/usuarioService";
import iCriarUsuarioSchema from "../../@types/iCriarUsuario";
import iLogin from "../../@types/iLogin";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";

class UsuarioController {
  async criarUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const data: iCriarUsuarioSchema = req.body;
      const usuarioCriado = await usuarioService.criarUsuario(data);
      return res.status(StatusCodes.CREATED).json(usuarioCriado);
    } catch (error) {
      return next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data: iLogin = req.body;
      const usuarioLogado = await usuarioService.login(data);

      if (usuarioLogado) {
        return res.status(StatusCodes.OK).json({
          auth: true,
          ...usuarioLogado,
        });
      }

      return next(createHttpError(401, "Login ou senha incorretos"));
    } catch (error) {
      return next(error);
    }
  }

  async listarUsuarios(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarios = await usuarioService.listarUsuarios();
      return res.status(StatusCodes.OK).json(usuarios);
    } catch (error) {
      return next(error);
    }
  }

  async listarUsuarioPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const usuario = await usuarioService.listarUsuarioPorId(payload.id);

      if (!usuario) {
        return next(createHttpError(404, "Usuário não encontrado"));
      }

      return res.status(StatusCodes.OK).json(usuario);
    } catch (error) {
      return next(error);
    }
  }
}

export const usuarioControler = new UsuarioController();
