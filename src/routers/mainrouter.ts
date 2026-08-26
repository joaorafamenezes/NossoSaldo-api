import { Router } from "express";
import { usuarioRouter } from "./usuario/usuarioRouter";
import { contaConjuntaRouter } from "./contaConjunta/contaConjuntaRouter";
import { gastoRouter } from "./gasto/gastoRouter";
import { relatorioRouter } from "./relatorio/relatorioRouter";
import { categoriaRouter } from "./categoria/categoriaRouter";
import { cartaoCreditoRouter } from "./cartaoCredito/cartaoCreditoRouter";
import { faturaCartaoRouter } from "./faturaCartao/faturaCartaoRouter";
import { insightsRouter } from "./insights/insightsRouter";
import { iaRouter } from "./ia/iaRouter";

const router = Router();

router.get("/health", (_req, res) => {
    res.status(200).json({
        message: "A API 'NossoSaldo' funcionando corretamente. Seguimos...",
    });
});

router.use(usuarioRouter);
router.use(contaConjuntaRouter);
router.use(gastoRouter);
router.use(relatorioRouter);
router.use(categoriaRouter);
router.use(cartaoCreditoRouter);
router.use(faturaCartaoRouter);
router.use(insightsRouter);
router.use(iaRouter);

export { router };
