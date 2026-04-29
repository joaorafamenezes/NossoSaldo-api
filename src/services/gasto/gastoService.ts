import createHttpError from "http-errors";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";
import iPagarGasto from "../../@types/gasto/iPagarGasto";
import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";

class GastoService {
    async criarGastoUsuarioLogado(data: iCriarGasto) {
        const { responsavelId } = data;
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "UsuÃƒÆ’Ã‚Â¡rio responsÃƒÆ’Ã‚Â¡vel pelo gasto nÃƒÆ’Ã‚Â£o encontrado.");
        }

        return await gastoRepository.criarGastoUsuarioLogado(data);
    }

    async listarGastosPorResponsavelId(responsavelId: string) {
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "UsuÃƒÆ’Ã‚Â¡rio nÃƒÆ’Ã‚Â£o encontrado.");
        }

        return await gastoRepository.listarGastosPorResponsavelId(responsavelId);
    }

    async buscarTotalGastoMesAtualPorResponsavelId(responsavelId: string) {
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "UsuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡rio nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o encontrado.");
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
            throw createHttpError(404, "Gasto nÃƒÆ’Ã‚Â£o encontrado.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "UsuÃƒÆ’Ã‚Â¡rio nÃƒÆ’Ã‚Â£o autorizado a acessar este gasto.");
        }

        return gasto;
    }

    async atualizarGasto(id: string, data: iAtualizarGasto, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nÃ£o encontrado.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "UsuÃ¡rio nÃ£o autorizado a atualizar este gasto.");
        }

        return await gastoRepository.atualizarGasto(id, data);
    }

    async pagarGasto(id: string, data: iPagarGasto, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nÃƒÂ£o encontrado.");
        }

        if (gasto.status === "pago") {
            throw createHttpError(400, "Gasto jÃƒÂ¡ estÃƒÂ¡ pago.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "UsuÃƒÂ¡rio nÃƒÂ£o autorizado a pagar este gasto.");
        }

        return await gastoRepository.pagarGasto(id, data.dataPagamento ?? new Date());
    }

    async deletarGasto(id: string, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nÃƒÂ£o encontrado.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "UsuÃƒÂ¡rio nÃƒÂ£o autorizado a excluir este gasto.");
        }

        await gastoRepository.deletarGasto(id);

        return { message: "Gasto marcado como excluÃƒÂ­do com sucesso." };
    }
}

export const gastoService = new GastoService();
