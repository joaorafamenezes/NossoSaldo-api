export default interface iCriarCartaoCredito {
  descricao: string;
  diaFechamento: number;
  diaVencimento: number;
  valorLimite: number;
  observacoes?: string;
}
