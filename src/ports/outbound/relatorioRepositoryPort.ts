export interface RelatorioRepositoryPort {
  gerarRelatorioEvolucaoMensal(de: Date, ate: Date, userId: string): Promise<any[]>;
  gerarRelatorioComparativoMensal(mesAtual: Date, mesAnterior: Date, userId: string): Promise<any[]>;
  gerarRelatorioTopCategoria(de: Date, ate: Date, userId: string): Promise<any[]>;
  gerarRelatorioQuemGastaMais(
    de: Date,
    ate: Date,
    usuarioLogadoId: string,
    usuario1Id: string,
    usuario2Id: string,
  ): Promise<any[]>;
  listarMovimentosProjecaoAnual(visibilidade: VisibilidadeProjecaoAnual): Promise<MovimentoProjecaoPersistido[]>;
}

export type VisibilidadeProjecaoAnual = {
  usuarioLogadoId: string;
  responsavelIds: string[];
  contaConjunta: boolean;
};

export type MovimentoProjecaoPersistido = {
  tipo: "receita" | "despesa";
  valor: number;
  ano: number;
  mes: number;
  categoriaId: string;
  categoriaNome: string;
  responsavelId: string;
};
