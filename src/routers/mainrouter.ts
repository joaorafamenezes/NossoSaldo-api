import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validateCreateUser } from "./middlewares/usuarioMiddleware";
import { usuarioControler } from "../controllers/usuarioController";
import { createUsuarioSchema } from "../schemas/usuario/createUsuarioSchema";

const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.json({ message: "API 'NossoSaldo' está funcionando corretamente" });
});

//POST - com middleware de validação inline
router.post("/usuario", validateCreateUser(createUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
  usuarioControler.criarUsuario(req, res, next).catch(next);
});

export { router }