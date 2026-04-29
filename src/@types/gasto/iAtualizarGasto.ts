export default interface iAtualizarGasto {
    descricao?: string;
    tipo?: "receita" | "despesa";
    status?: "pendente" | "pago" | "atrasado" | "cancelado";
    origemLancamento?: "unico" | "recorrente" | "parcelado";
    valor?: number;
    competencia?: Date | null;
    dataVencimento?: Date | null;
    dataPagamento?: Date | null;
    observacao?: string | null;
    categoriaId?: string;
    contaConjuntaId?: string | null;
}
