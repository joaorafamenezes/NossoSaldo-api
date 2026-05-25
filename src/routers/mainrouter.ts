import { Router } from "express";
import { usuarioRouter } from "./usuario/usuarioRouter";
import { contaConjuntaRouter } from "./contaConjunta/contaConjuntaRouter";
import { gastoRouter } from "./gasto/gastoRouter";
import { relatorioRouter } from "./relatorio/relatorioRouter";
import { categoriaRouter } from "./categoria/categoriaRouter";
import { cartaoCreditoRouter } from "./cartaoCredito/cartaoCreditoRouter";
import { faturaCartaoRouter } from "./faturaCartao/faturaCartaoRouter";

const router = Router();

router.get("/health", (_req, res) => {
    res.status(200).json({
        message: "API 'NossoSaldo' funcionando corretamente.",
    });
});

router.use(usuarioRouter);
router.use(contaConjuntaRouter);
router.use(gastoRouter);
router.use(relatorioRouter);
router.use(categoriaRouter);
router.use(cartaoCreditoRouter);
router.use(faturaCartaoRouter);

export { router };
