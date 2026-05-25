import { Router } from "express";
import type { Request, Response } from "express";
import { cartaoCreditoRouter } from "./cartaoCredito/cartaoCreditoRouter";
import { categoriaRouter } from "./categoria/categoriaRouter";
import { contaConjuntaRouter } from "./contaConjunta/contaConjuntaRouter";
import { faturaCartaoRouter } from "./faturaCartao/faturaCartaoRouter";
import { gastoRouter } from "./gasto/gastoRouter";
import { relatorioRouter } from "./relatorio/relatorioRouter";
import { usuarioRouter } from "./usuario/usuarioRouter";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
    res.json({ message: "API 'NossoSaldo' estÃƒÂ¡ funcionando corretamente" });
});

router.use(usuarioRouter);
router.use(cartaoCreditoRouter);
router.use(categoriaRouter);
router.use(contaConjuntaRouter);
router.use(faturaCartaoRouter);
router.use(gastoRouter);
router.use(relatorioRouter);

export { router };
