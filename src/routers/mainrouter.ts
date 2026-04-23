import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validateUser } from "./middlewares/usuarioMiddleware";
import { usuarioControler } from "../controllers/usuario/usuarioController";
import { createUsuarioSchema } from "../schemas/usuario/createUsuarioSchema";
import { loginSchema } from '../schemas/login/loginSchema';
import validarToken from "./middlewares/loginMiddleware";
import { categoriaController } from "../controllers/categoria/categoriaController";
import { createCategoriaSchema } from "../schemas/categoria/createCategoriaSchema";

const router = Router();

//------------> GET <------------//
router.get("/health", (req: Request, res: Response) => {
  res.json({ message: "API 'NossoSaldo' está funcionando corretamente" });
});
router.get("/categorias", validarToken, (req: Request, res: Response, next: NextFunction) => {
  categoriaController.buscarTodasCategorias(req, res, next).catch(next);
});
router.get("/usuarios", validarToken, (req: Request, res: Response, next: NextFunction) => {
  usuarioControler.listarUsuarios(req, res, next).catch(next);
});
router.get("/usuario", validarToken, (req: Request, res: Response, next: NextFunction) => {
  usuarioControler.listarUsuarioPorId(req, res, next).catch(next);
});

//------------> POST <------------//
router.post("/usuario", validarToken, validateUser(createUsuarioSchema), (req: Request, res: Response, next: NextFunction) => {
  usuarioControler.criarUsuario(req, res, next).catch(next);
});
router.post("/login", validateUser(loginSchema), usuarioControler.login.bind(usuarioControler));
router.post("/categoria", validarToken, validateUser(createCategoriaSchema), (req: Request, res: Response, next: NextFunction) => {
  categoriaController.criarCategoria(req, res, next).catch(next);
});


export { router }
