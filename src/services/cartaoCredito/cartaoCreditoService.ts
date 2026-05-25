import iCriarCartaoCredito from "../../@types/cartaoCredito/iCriarCartaoCredito";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";
import createHttpError from "http-errors";

class CartaoCreditoService {
  async criarCartaoCredito(usuarioId: string, data: iCriarCartaoCredito) {
    return await cartaoCreditoRepository.criarCartaoCredito(usuarioId, data);
  }

  async listarCartoesCreditoPorUsuario(usuarioId: string) {
    return await cartaoCreditoRepository.listarCartoesCreditoPorUsuario(usuarioId);
  }

  async buscarCartaoCreditoPorId(id: string) {
    return await cartaoCreditoRepository.buscarCartaoCreditoPorId(id);
  }

  async atualizarCartaoCredito(id: string, usuarioId: string, data: iCriarCartaoCredito) {
    const cartao = await cartaoCreditoRepository.buscarCartaoCreditoPorId(id);

    if (!cartao) {
      throw createHttpError(404, "Cartao de credito nao encontrado.");
    }

    if (cartao.usuarioId !== usuarioId) {
      throw createHttpError(403, "Usuario nao autorizado a atualizar este cartao de credito.");
    }

    return await cartaoCreditoRepository.atualizarCartaoCredito(id, data);
  }
}

export const cartaoCreditoService = new CartaoCreditoService();
