export type InsightExpenseRow = {
  id: string;
  tipo: string;
  status: string;
  valor: number | string;
  competencia: Date | null;
  categoriaId: string;
  categoriaDescricao: string | null;
};

export interface InsightsRepositoryPort {
  listarGastosPorPeriodo(de: Date, ate: Date, userId: string): Promise<InsightExpenseRow[]>;
}
