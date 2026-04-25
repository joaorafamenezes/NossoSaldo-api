import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { usuarioService } from "../../services/usuario/usuarioService";
import iCriarUsuarioSchema from "../../@types/usuario/iCriarUsuario";
import iLogin from "../../@types/iLogin";
import { StatusCodes } from "http-status-codes";
import { Token } from "../../secure/authorization";
import iAtualizaUsuarioSchema from "../../@types/usuario/iAtualizaUsuario";

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

  async atualizaUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const dadosAtualizados: Partial<iAtualizaUsuarioSchema> = req.body;
      const usuarioAtualizado = await usuarioService.atualizaUsuario(payload.id, dadosAtualizados);

      if (!usuarioAtualizado) {
        return next(createHttpError(404, "Usuário não encontrado"));
      }

      return res.status(StatusCodes.OK).json(usuarioAtualizado);
    } catch (error) {
      return next(error);
    }
  }

  async atualizaSenhaUsuario(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = res.locals.payload as Token;
      const novaSenha: string = req.body.senha;
      const senhaAtualizada = await usuarioService.atualizaSenhaUsuario(payload.id, novaSenha);

      if (senhaAtualizada == false) {
        return next(createHttpError(404, "Usuário não encontrado"));
      }

      return res.status(StatusCodes.OK).json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
      return next(error);
    }
  }
}

export const usuarioControler = new UsuarioController();
