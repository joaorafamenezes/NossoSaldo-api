import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { validateUser } from "../middlewares/usuarioMiddleware";
import validarToken from "../middlewares/loginMiddleware";
import { usuarioControler } from "../../controllers/usuario/usuarioController";
import { createUsuarioSchema } from "../../schemas/usuario/createUsuarioSchema";
import { loginSchema } from "../../schemas/login/loginSchema";
import { atualizaUsuarioSchema } from "../../schemas/usuario/atualizaUsuarioSchema";
import { atualizaSenhaUsuarioSchema } from "../../schemas/usuario/atualizaSenhaUsuarioSchema";
import { solicitarResetSenhaSchema } from "../../schemas/usuario/solicitarResetSenhaSchema";
import { redefinirSenhaComTokenSchema } from "../../schemas/usuario/redefinirSenhaComTokenSchema";
import { validarEmailSchema } from "../../schemas/usuario/validarEmailSchema";

const usuarioRouter = Router();

usuarioRouter.get("/usuarios", validarToken, (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.listarUsuarios(req, res, next).catch(next);
});

usuarioRouter.get("/usuarios/listarUsuarioPorId", validarToken, (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.listarUsuarioPorId(req, res, next).catch(next);
});

usuarioRouter.post("/usuarios", validateUser(createUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.criarUsuario(req, res, next).catch(next);
});

usuarioRouter.post("/login", validateUser(loginSchema), usuarioControler.login.bind(usuarioControler));

usuarioRouter.post("/usuarios/esqueci-senha", validateUser(solicitarResetSenhaSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.solicitarRecuperacaoSenha(req, res, next).catch(next);
});

usuarioRouter.post("/usuarios/solicitarRedefinicaoSenha", validateUser(solicitarResetSenhaSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.solicitarRecuperacaoSenha(req, res, next).catch(next);
});

usuarioRouter.get("/usuarios/redefinir-senha/validar", (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.validarTokenRecuperacaoSenha(req, res, next).catch(next);
});

usuarioRouter.patch("/usuarios/redefinir-senha", validateUser(redefinirSenhaComTokenSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.redefinirSenhaComToken(req, res, next).catch(next);
});

usuarioRouter.patch("/usuarios/validar-email", validateUser(validarEmailSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.validarEmail(req, res, next).catch(next);
});

usuarioRouter.patch("/usuarios", validarToken, validateUser(atualizaUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.atualizaUsuario(req, res, next).catch(next);
});

usuarioRouter.patch("/usuarios/atualizaSenha", validarToken, validateUser(atualizaSenhaUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
    usuarioControler.atualizaSenhaUsuario(req, res, next).catch(next);
});

export { usuarioRouter };
