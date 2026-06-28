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
}
