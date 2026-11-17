export type MovimentoProjecaoAnual = {
  tipo: "receita" | "despesa";
  valor: number;
  ano: number;
  mes: number;
  categoriaId: string;
  categoriaNome: string;
  responsavelId: string;
};

export type SerieMensal = {
  meses: number[];
  total: number;
};

export type LinhaCategoriaProjecao = SerieMensal & {
  categoriaId: string;
  categoria: string;
};

export type MembroContaRelatorio = {
  id: string;
  nome: string;
};

export type ProjecaoAnual = {
  ano: number;
  receitas: LinhaCategoriaProjecao[];
  despesas: LinhaCategoriaProjecao[];
  totalReceitas: SerieMensal;
  totalDespesas: SerieMensal;
  saldo: SerieMensal;
  anosDisponiveis: number[];
  categoriasDisponiveis: { id: string; nome: string }[];
  contaConjunta: { membros: MembroContaRelatorio[] } | null;
  semMovimentacaoNoAno: boolean;
  semMovimentacaoNosFiltros: boolean;
};

type Balde = {
  meses: number[];
  totalCents: number;
};

function paraCentavos(valor: number): number {
  return Math.round(valor * 100);
}

function paraReais(centavos: number): number {
  return Math.round(centavos) / 100;
}

function baldeVazio(): Balde {
  return { meses: Array(12).fill(0), totalCents: 0 };
}

function fecharBalde(balde: Balde): SerieMensal {
  return {
    meses: balde.meses.map(paraReais),
    total: paraReais(balde.totalCents),
  };
}

function anosDisponiveisDe(movimentos: MovimentoProjecaoAnual[], anoVigente: number): number[] {
  if (movimentos.length === 0) {
    return [anoVigente];
  }

  const anos = movimentos.map((movimento) => movimento.ano);
  const inicio = Math.min(...anos);
  const fim = Math.max(Math.max(...anos), anoVigente);
  const faixa: number[] = [];

  for (let ano = inicio; ano <= fim; ano += 1) {
    faixa.push(ano);
  }

  return faixa;
}

export function montarProjecaoAnual(params: {
  movimentos: MovimentoProjecaoAnual[];
  ano: number;
  anoVigente: number;
  categoriaId?: string | null;
  responsavelId?: string | null;
  contaConjunta: { membros: MembroContaRelatorio[] } | null;
}): ProjecaoAnual {
  const doAno = params.movimentos.filter((movimento) => movimento.ano === params.ano && movimento.mes >= 1 && movimento.mes <= 12);
  const semMovimentacaoNoAno = doAno.length === 0;
  const doResponsavel = params.responsavelId
    ? doAno.filter((movimento) => movimento.responsavelId === params.responsavelId)
    : doAno;

  const categorias = new Map<string, string>();
  for (const movimento of doResponsavel) {
    categorias.set(movimento.categoriaId, movimento.categoriaNome);
  }

  const filtrados = params.categoriaId
    ? doResponsavel.filter((movimento) => movimento.categoriaId === params.categoriaId)
    : doResponsavel;

  const receitas = new Map<string, { nome: string; balde: Balde }>();
  const despesas = new Map<string, { nome: string; balde: Balde }>();
  const totalReceitas = baldeVazio();
  const totalDespesas = baldeVazio();

  for (const movimento of filtrados) {
    const centavos = paraCentavos(movimento.valor);
    const mapa = movimento.tipo === "receita" ? receitas : despesas;
    const totais = movimento.tipo === "receita" ? totalReceitas : totalDespesas;
    const linha = mapa.get(movimento.categoriaId) ?? { nome: movimento.categoriaNome, balde: baldeVazio() };
    const indice = movimento.mes - 1;

    linha.balde.meses[indice] += centavos;
    linha.balde.totalCents += centavos;
    mapa.set(movimento.categoriaId, linha);
    totais.meses[indice] += centavos;
    totais.totalCents += centavos;
  }

  const linhasDe = (mapa: Map<string, { nome: string; balde: Balde }>): LinhaCategoriaProjecao[] =>
    Array.from(mapa.entries())
      .map(([categoriaId, linha]) => ({
        categoriaId,
        categoria: linha.nome,
        ...fecharBalde(linha.balde),
      }))
      .filter((linha) => linha.meses.some((mes) => mes !== 0))
      .sort((primeira, segunda) => primeira.categoria.localeCompare(segunda.categoria, "pt-BR"));

  const saldoCentavos = totalReceitas.meses.map((valor, indice) => valor - totalDespesas.meses[indice]);

  return {
    ano: params.ano,
    receitas: linhasDe(receitas),
    despesas: linhasDe(despesas),
    totalReceitas: fecharBalde(totalReceitas),
    totalDespesas: fecharBalde(totalDespesas),
    saldo: {
      meses: saldoCentavos.map(paraReais),
      total: paraReais(totalReceitas.totalCents - totalDespesas.totalCents),
    },
    anosDisponiveis: anosDisponiveisDe(params.movimentos, params.anoVigente),
    categoriasDisponiveis: Array.from(categorias.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((primeira, segunda) => primeira.nome.localeCompare(segunda.nome, "pt-BR")),
    contaConjunta: params.contaConjunta,
    semMovimentacaoNoAno,
    semMovimentacaoNosFiltros: !semMovimentacaoNoAno && filtrados.length === 0,
  };
}
