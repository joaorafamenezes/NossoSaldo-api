export type CartaoFaturaInput = {
  id: string;
  diaFechamento: number;
  diaVencimento: number;
};

export interface FaturaCartaoRepositoryPort {
  buscarFaturaPorIdParaUsuario(faturaId: string, usuarioId: string): Promise<any>;
  listarFaturasPorUsuario(usuarioId: string, cartaoCreditoId?: string): Promise<any[]>;
  buscarOuCriarFatura(cartao: CartaoFaturaInput, dataReferencia: Date): Promise<any>;
  buscarOuCriarFaturaPorCompetencia(cartao: CartaoFaturaInput, competenciaReferencia: Date): Promise<any>;
  recalcularValorTotal(faturaCartaoId: string): Promise<any>;
  pagarFatura(faturaCartaoId: string, dataPagamento: Date): Promise<any>;
  reabrirFatura(faturaCartaoId: string): Promise<any>;
}
