import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";

export interface GastoRepositoryPort {
  criarGastoUsuarioLogado(gasto: iCriarGasto): Promise<any>;
  listarGastosPorResponsavelId(responsavelId: string): Promise<any[]>;
  buscarTotalGastoMesAtualPorResponsavelId(responsavelId: string, inicioMes: Date, fimMes: Date): Promise<number>;
  listarModelosRecorrentesAtivosPorResponsaveis(responsaveisIds: string[], inicioMes: Date, fimMes: Date): Promise<any[]>;
  buscarGastoGeradoPorRecorrencia(recorrenciaPaiId: string, inicioMes: Date, fimMes: Date): Promise<any>;
  listarGastosDaSerieRecorrente(recorrenciaPaiId: string): Promise<any[]>;
  calcularDataVencimentoRecorrente(dataVencimentoOriginal: Date, competencia: Date): Date;
  normalizarCompetenciaMes(date: Date): Date;
  buscarGastoPorId(id: string): Promise<any>;
  pagarGasto(id: string, dataPagamento: Date): Promise<any>;
  reabrirGasto(id: string): Promise<any>;
  buscarLancamentoBasePorId(id: string): Promise<any>;
  listarLancamentosBasePorGastoId(gastoId: string): Promise<any[]>;
  vincularLancamentoBaseAFatura(lancamentoBaseId: string, faturaCartaoId: string): Promise<void>;
  pagarLancamentoBase(id: string, dataPagamento: Date): Promise<any>;
  atualizarGasto(id: string, data: iAtualizarGasto): Promise<any>;
  deletarGasto(id: string): Promise<any>;
}
