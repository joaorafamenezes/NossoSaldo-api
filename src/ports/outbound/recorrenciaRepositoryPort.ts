import {
  iCriarRecorrencia,
  iAtualizarRecorrencia,
  iPausarRecorrencia,
  iFiltroRecorrencias,
} from "../../@types/recorrencia/iRecorrencia";

export interface RecorrenciaRepositoryPort {
  criarRecorrencia(data: iCriarRecorrencia): Promise<any>;
  buscarRecorrenciaPorId(id: string): Promise<any | null>;
  listarRecorrenciasPorUsuario(responsavelId: string, filtros?: iFiltroRecorrencias): Promise<any[]>;
  listarRecorrenciasAtivasNoPeriodo(responsaveisIds: string[], de: Date, ate: Date): Promise<any[]>;
  atualizarRecorrencia(id: string, data: iAtualizarRecorrencia): Promise<any>;
  pausarRecorrencia(id: string, data: iPausarRecorrencia): Promise<any>;
  retomarRecorrencia(id: string): Promise<any>;
  deletarRecorrencia(id: string): Promise<any>;
}
