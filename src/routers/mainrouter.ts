import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validateCreateUser } from "./middlewares/usuarioMiddleware";
import { usuarioControler } from "../controllers/usuarioController";
import { createUsuarioSchema } from "../schemas/usuario/createUsuarioSchema";
import validateLogin from "./middlewares/loginMiddleware";

const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.json({ message: "API 'NossoSaldo' está funcionando corretamente" });
});
router.get("/auth/check", validateLogin, (_req: Request, res: Response) => {
  return res.status(200).json({
    auth: true,
    payload: res.locals.auth,
  });
});

//POST
router.post("/usuario", validateLogin, validateCreateUser(createUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
  usuarioControler.criarUsuario(req, res, next).catch(next);
});
router.post("/login", usuarioControler.login.bind(usuarioControler));

export { router }
