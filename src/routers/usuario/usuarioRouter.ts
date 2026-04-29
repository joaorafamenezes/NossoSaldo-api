import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { validateUser } from "../middlewares/usuarioMiddleware";
import validarToken from "../middlewares/loginMiddleware";
import { usuarioControler } from "../../controllers/usuario/usuarioController";
import { createUsuarioSchema } from "../../schemas/usuario/createUsuarioSchema";
import { loginSchema } from "../../schemas/login/loginSchema";
import { atualizaUsuarioSchema } from "../../schemas/usuario/atualizaUsuarioSchema";
import { atualizaSenhaUsuarioSchema } from "../../schemas/usuario/atualizaSenhaUsuarioSchema";

const usuarioRouter = Router();

usuarioRouter.get("/usuarios", validarToken, (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.listarUsuarios(req, res, next).catch(next);
});

usuarioRouter.get("/usuario", validarToken, (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.listarUsuarioPorId(req, res, next).catch(next);
});

usuarioRouter.post("/usuario", validateUser(createUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.criarUsuario(req, res, next).catch(next);
});

usuarioRouter.post("/login", validateUser(loginSchema), usuarioControler.login.bind(usuarioControler));

usuarioRouter.patch("/usuario", validarToken, validateUser(atualizaUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.atualizaUsuario(req, res, next).catch(next);
});

usuarioRouter.patch("/atualizaSenha", validarToken, validateUser(atualizaSenhaUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.atualizaSenhaUsuario(req, res, next).catch(next);
});

export { usuarioRouter };
