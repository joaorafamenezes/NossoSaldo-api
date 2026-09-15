export type TipoGasto = "receita" | "despesa";
export type FrequenciaRecorrencia = "mensal" | "anual" | "semanal";

export interface iCriarRecorrencia {
  descricao: string;
  tipo: TipoGasto;
  valor: number;
  diaVencimento: number;
  frequencia?: FrequenciaRecorrencia;
  dataInicio: string | Date;
  dataFim?: string | Date | null;
  naoCompartilhar?: boolean;
  observacao?: string | null;
  categoriaId: string;
  responsavelId: string;
  cartaoCreditoId?: string | null;
}

export interface iAtualizarRecorrencia {
  descricao?: string;
  tipo?: TipoGasto;
  valor?: number;
  diaVencimento?: number;
  frequencia?: FrequenciaRecorrencia;
  dataInicio?: string | Date;
  dataFim?: string | Date | null;
  naoCompartilhar?: boolean;
  observacao?: string | null;
  categoriaId?: string;
  cartaoCreditoId?: string | null;
}

export interface iPausarRecorrencia {
  dataPausaInicio?: string | Date | null;
  dataPausaFim?: string | Date | null;
  motivoPausa?: string | null;
}

export interface iFiltroRecorrencias {
  status?: "ativa" | "pausada" | "todas";
  tipo?: TipoGasto;
  categoriaId?: string;
}
