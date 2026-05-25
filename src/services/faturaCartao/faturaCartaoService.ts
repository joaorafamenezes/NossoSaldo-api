import { faturaCartaoRepository } from "../../repositories/faturaCartao/faturaCartaoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import createHttpError from "http-errors";
import iPagarGasto from "../../@types/gasto/iPagarGasto";

class FaturaCartaoService {
  async listarFaturasPorUsuario(usuarioId: string, cartaoCreditoId?: string) {
    const usuario = await usuarioRepository.listarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    return await faturaCartaoRepository.listarFaturasPorUsuario(usuarioId, cartaoCreditoId);
  }

  async pagarFatura(faturaId: string, data: iPagarGasto, usuarioId: string) {
    const usuario = await usuarioRepository.listarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    const fatura = await faturaCartaoRepository.buscarFaturaPorIdParaUsuario(faturaId, usuarioId);

    if (!fatura) {
      throw createHttpError(404, "Fatura do cartao nao encontrada.");
    }

    if (fatura.status === "paga") {
      throw createHttpError(400, "Fatura ja esta paga.");
    }

    if (fatura.status === "cancelada") {
      throw createHttpError(400, "Fatura cancelada nao pode ser paga.");
    }

    return await faturaCartaoRepository.pagarFatura(faturaId, data.dataPagamento ?? new Date());
  }

  async reabrirFatura(faturaId: string, usuarioId: string) {
    const usuario = await usuarioRepository.listarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    const fatura = await faturaCartaoRepository.buscarFaturaPorIdParaUsuario(faturaId, usuarioId);

    if (!fatura) {
      throw createHttpError(404, "Fatura do cartao nao encontrada.");
    }

    if (fatura.status !== "paga") {
      throw createHttpError(400, "Somente faturas pagas podem ser reabertas.");
    }

    return await faturaCartaoRepository.reabrirFatura(faturaId);
  }
}

export const faturaCartaoService = new FaturaCartaoService();
