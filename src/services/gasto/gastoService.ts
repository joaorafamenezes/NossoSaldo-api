import createHttpError from "http-errors";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";
import iPagarGasto from "../../@types/gasto/iPagarGasto";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";

class GastoService {
    async criarGastoUsuarioLogado(data: iCriarGasto) {
        const { responsavelId } = data;
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "Usuario responsavel pelo gasto nao encontrado.");
        }

        return await gastoRepository.criarGastoUsuarioLogado(data);
    }

    async listarGastosPorResponsavelId(responsavelId: string) {
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "Usuario nao encontrado.");
        }

        return await gastoRepository.listarGastosPorResponsavelId(responsavelId);
    }

    async buscarTotalGastoMesAtualPorResponsavelId(responsavelId: string) {
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "Usuario nao encontrado.");
        }

        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
        const totalGastoMesAtual = await gastoRepository.buscarTotalGastoMesAtualPorResponsavelId(
            responsavelId,
            inicioMes,
            fimMes,
        );

        return {
            referencia: `${inicioMes.getFullYear()}-${String(inicioMes.getMonth() + 1).padStart(2, "0")}`,
            totalGastoMesAtual,
        };
    }

    async detalharGastoPorId(id: string, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        const gastoCompartilhavel = gasto.responsavelId !== userId && !(gasto as any).naoCompartilhar;
        const contasConjuntas = gastoCompartilhavel
            ? await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(userId)
            : [];
        const usuarioCompartilhaComResponsavel = contasConjuntas.some((conta) => (
            conta.usuario1Id === gasto.responsavelId || conta.usuario2Id === gasto.responsavelId
        ));

        if (gasto.responsavelId !== userId && !usuarioCompartilhaComResponsavel) {
            throw createHttpError(403, "Usuario nao autorizado a acessar este gasto.");
        }

        return gasto;
    }

    async atualizarGasto(id: string, data: iAtualizarGasto, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a atualizar este gasto.");
        }

        return await gastoRepository.atualizarGasto(id, data);
    }

    async pagarGasto(id: string, data: iPagarGasto, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        if (gasto.status === "pago") {
            throw createHttpError(400, "Gasto ja esta pago.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a pagar este gasto.");
        }

        if (gasto.origemLancamento === "parcelado") {
            const lancamentosBase = Array.isArray((gasto as any).lancamentosBase)
                ? (gasto as any).lancamentosBase
                : [];
            const todasParcelasPagas = lancamentosBase.length > 0
                && lancamentosBase.every((parcela: { status: string }) => parcela.status === "pago");

            if (!todasParcelasPagas) {
                throw createHttpError(400, "Gasto parcelado so pode ser quitado quando todas as parcelas estiverem pagas.");
            }
        }

        return await gastoRepository.pagarGasto(id, data.dataPagamento ?? new Date());
    }

    async pagarParcela(id: string, data: iPagarGasto, userId: string) {
        const parcela = await gastoRepository.buscarLancamentoBasePorId(id);

        if (!parcela) {
            throw createHttpError(404, "Parcela nao encontrada.");
        }

        if (parcela.status === "pago") {
            throw createHttpError(400, "Parcela ja esta paga.");
        }

        if (parcela.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a pagar esta parcela.");
        }

        return await gastoRepository.pagarLancamentoBase(id, data.dataPagamento ?? new Date());
    }

    async deletarGasto(id: string, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a excluir este gasto.");
        }

        await gastoRepository.deletarGasto(id);

        return { message: "Gasto marcado como excluido com sucesso." };
    }
}

export const gastoService = new GastoService();
