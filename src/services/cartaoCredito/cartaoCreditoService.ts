import createHttpError from "http-errors";
import iCriarCartaoCredito from "../../@types/cartaoCredito/iCriarCartaoCredito";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";
import { CartaoCreditoRepositoryPort } from "../../ports/outbound/cartaoCreditoRepositoryPort";

export class CartaoCreditoService {
  constructor(private readonly cartaoCreditoRepository: CartaoCreditoRepositoryPort) {}

  async criarCartaoCredito(usuarioId: string, data: iCriarCartaoCredito) {
    return await this.cartaoCreditoRepository.criarCartaoCredito(usuarioId, data);
  }

  async listarCartoesCreditoPorUsuario(usuarioId: string) {
    return await this.cartaoCreditoRepository.listarCartoesCreditoPorUsuario(usuarioId);
  }

  async buscarCartaoCreditoPorId(id: string) {
    return await this.cartaoCreditoRepository.buscarCartaoCreditoPorId(id);
  }

  async atualizarCartaoCredito(id: string, usuarioId: string, data: iCriarCartaoCredito) {
    const cartao = await this.cartaoCreditoRepository.buscarCartaoCreditoPorId(id);

    if (!cartao) {
      throw createHttpError(404, "Cartao de credito nao encontrado.");
    }

    if (cartao.usuarioId !== usuarioId) {
      throw createHttpError(403, "Usuario nao autorizado a atualizar este cartao de credito.");
    }

    return await this.cartaoCreditoRepository.atualizarCartaoCredito(id, data);
  }
}

export const cartaoCreditoService = new CartaoCreditoService(cartaoCreditoRepository);
