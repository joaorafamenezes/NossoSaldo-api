import iCriarCartaoCredito from "../../@types/cartaoCredito/iCriarCartaoCredito";

export interface CartaoCreditoRepositoryPort {
  criarCartaoCredito(usuarioId: string, cartao: iCriarCartaoCredito): Promise<any>;
  listarCartoesCreditoPorUsuario(usuarioId: string): Promise<any[]>;
  buscarCartaoCreditoPorId(id: string): Promise<any>;
  atualizarCartaoCredito(id: string, cartao: iCriarCartaoCredito): Promise<any>;
}
