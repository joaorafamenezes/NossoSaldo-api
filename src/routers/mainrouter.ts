import { Router } from "express";
import type { Request, Response } from "express";
import authorization from "../secure/authorization";
import { categoriaRouter } from "./categoria/categoriaRouter";
import { contaConjuntaRouter } from "./contaConjunta/contaConjuntaRouter";
import { gastoRouter } from "./gasto/gastoRouter";
import { usuarioRouter } from "./usuario/usuarioRouter";

const router = Router();
const appBootedAt = new Date().toISOString();

router.get("/health", (_req: Request, res: Response) => {
    res.json({ message: "API 'NossoSaldo' estÃƒÂ¡ funcionando corretamente" });
});

router.get("/debug/jwt", (_req: Request, res: Response) => {
    res.json({
        pid: process.pid,
        bootedAt: appBootedAt,
        cwd: process.cwd(),
        ...authorization.getJwtDiagnostics(),
    });
});

router.use(usuarioRouter);
router.use(categoriaRouter);
router.use(contaConjuntaRouter);
router.use(gastoRouter);

export { router };
