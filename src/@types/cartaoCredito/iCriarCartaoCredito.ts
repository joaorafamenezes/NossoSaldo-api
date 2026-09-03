export default interface iCriarCartaoCredito {
  descricao: string;
  diaFechamento: number;
  diaVencimento: number;
  valorLimite: number;
  cor?: string;
  corGradiente?: string;
  ultimosDigitos?: string;
  bandeira?: string;
  observacoes?: string;
}
