export default interface iCriarGasto {
    descricao: string;
    tipo: "receita" | "despesa";
    status: "pendente" | "pago" | "atrasado" | "cancelado";
    origemLancamento: "unico" | "recorrente" | "parcelado";
    valor: number;
    competencia?: Date;
    dataVencimento?: Date;
    dataPagamento?: Date;
    observacao?: string;
    categoriaId: string;
    contaConjuntaId?: string;
    responsavelId: string;
}
