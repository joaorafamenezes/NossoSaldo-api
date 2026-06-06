import { gastoService } from "../gasto/gastoService";
import { InsightExpenseRow, insightsRepository } from "../../repositories/insights/insightsRepository";

type InsightGargalo = {
  codigo: string;
  titulo: string;
  descricao: string;
  severidade: "baixa" | "media" | "alta";
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function summarizeExpenses(gastos: InsightExpenseRow[]) {
  return gastos.reduce((accumulator, gasto) => {
    const valor = toNumber(gasto.valor);

    if (gasto.tipo === "receita") {
      accumulator.totalReceita += valor;
    }

    if (gasto.tipo === "despesa") {
      accumulator.totalDespesa += valor;

      if (gasto.status === "pendente") {
        accumulator.quantidadePendentes += 1;
        accumulator.valorPendentes += valor;
      }

      if (gasto.status === "atrasado") {
        accumulator.quantidadeAtrasados += 1;
        accumulator.valorAtrasados += valor;
      }
    }

    return accumulator;
  }, {
    totalReceita: 0,
    totalDespesa: 0,
    quantidadePendentes: 0,
    valorPendentes: 0,
    quantidadeAtrasados: 0,
    valorAtrasados: 0,
  });
}

function summarizeTopCategories(gastos: InsightExpenseRow[], limit = 3) {
  const categories = new Map<string, { categoria: string; totalGasto: number; quantidadeGastos: number }>();

  for (const gasto of gastos) {
    if (gasto.tipo !== "despesa") {
      continue;
    }

    const categoria = gasto.categoriaDescricao ?? "Sem categoria";
    const current = categories.get(categoria) ?? {
      categoria,
      totalGasto: 0,
      quantidadeGastos: 0,
    };

    current.totalGasto += toNumber(gasto.valor);
    current.quantidadeGastos += 1;
    categories.set(categoria, current);
  }

  return Array.from(categories.values())
    .sort((first, second) => second.totalGasto - first.totalGasto)
    .slice(0, limit);
}

function calculatePreviousPeriod(de: Date, ate: Date) {
  const start = new Date(de);
  const end = new Date(ate);
  const periodInMs = end.getTime() - start.getTime();

  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd.getTime() - periodInMs);
  previousStart.setHours(0, 0, 0, 0);

  return { previousStart, previousEnd };
}

function defineNivelAtencao(gargalos: InsightGargalo[]) {
  if (gargalos.some((gargalo) => gargalo.severidade === "alta")) {
    return "alto";
  }

  if (gargalos.some((gargalo) => gargalo.severidade === "media")) {
    return "medio";
  }

  return "baixo";
}

class InsightsService {
  async gerarInsightsGargalos(de: string, ate: string, userId: string) {
    const dataDe = new Date(de);
    const dataAte = new Date(ate);
    dataAte.setHours(23, 59, 59, 999);

    const { previousStart, previousEnd } = calculatePreviousPeriod(dataDe, dataAte);

    await gastoService.gerarGastosRecorrentesPorPeriodo(userId, previousStart, dataAte);

    const [gastosAtuais, gastosAnteriores] = await Promise.all([
      insightsRepository.listarGastosPorPeriodo(dataDe, dataAte, userId),
      insightsRepository.listarGastosPorPeriodo(previousStart, previousEnd, userId),
    ]);

    const resumoAtual = summarizeExpenses(gastosAtuais);
    const resumoAnterior = summarizeExpenses(gastosAnteriores);
    const topCategorias = summarizeTopCategories(gastosAtuais);

    const totalReceita = resumoAtual.totalReceita;
    const totalDespesa = resumoAtual.totalDespesa;
    const saldo = totalReceita - totalDespesa;
    const quantidadePendentes = resumoAtual.quantidadePendentes;
    const valorPendentes = resumoAtual.valorPendentes;
    const quantidadeAtrasados = resumoAtual.quantidadeAtrasados;
    const valorAtrasados = resumoAtual.valorAtrasados;
    const despesaPeriodoAnterior = resumoAnterior.totalDespesa;
    const percentualUsoReceita = totalReceita > 0 ? Number(((totalDespesa / totalReceita) * 100).toFixed(1)) : 0;
    const variacaoDespesas = despesaPeriodoAnterior > 0
      ? Number((((totalDespesa - despesaPeriodoAnterior) / despesaPeriodoAnterior) * 100).toFixed(1))
      : (totalDespesa > 0 ? 100 : 0);

    const topCategoria = topCategorias[0]
      ? {
          categoria: topCategorias[0].categoria,
          total: topCategorias[0].totalGasto,
          percentual: totalDespesa > 0
            ? Number(((topCategorias[0].totalGasto / totalDespesa) * 100).toFixed(1))
            : 0,
        }
      : null;

    const gargalos: InsightGargalo[] = [];

    if (totalReceita > 0 && percentualUsoReceita >= 90) {
      gargalos.push({
        codigo: "COMPROMETIMENTO_RENDA",
        titulo: "Renda muito comprometida",
        descricao: `Suas despesas consumiram ${percentualUsoReceita}% da receita no periodo.`,
        severidade: "alta",
      });
    } else if (totalReceita > 0 && percentualUsoReceita >= 75) {
      gargalos.push({
        codigo: "COMPROMETIMENTO_RENDA",
        titulo: "Renda em zona de atencao",
        descricao: `Suas despesas consumiram ${percentualUsoReceita}% da receita no periodo.`,
        severidade: "media",
      });
    }

    if (quantidadeAtrasados > 0) {
      gargalos.push({
        codigo: "GASTOS_ATRASADOS",
        titulo: "Pagamentos atrasados",
        descricao: `Voce possui ${quantidadeAtrasados} gasto(s) atrasado(s), totalizando ${valorAtrasados.toFixed(2)}.`,
        severidade: "alta",
      });
    }

    if (quantidadePendentes >= 3 || valorPendentes > 0) {
      gargalos.push({
        codigo: "GASTOS_PENDENTES",
        titulo: "Pendencias em aberto",
        descricao: `Existem ${quantidadePendentes} gasto(s) pendente(s), somando ${valorPendentes.toFixed(2)}.`,
        severidade: quantidadePendentes >= 5 ? "alta" : "media",
      });
    }

    if (variacaoDespesas >= 15) {
      gargalos.push({
        codigo: "ALTA_DESPESAS",
        titulo: "Despesas subiram no periodo",
        descricao: `As despesas cresceram ${variacaoDespesas}% em relacao ao periodo anterior equivalente.`,
        severidade: variacaoDespesas >= 30 ? "alta" : "media",
      });
    }

    if (topCategoria && topCategoria.percentual >= 35) {
      gargalos.push({
        codigo: "CONCENTRACAO_CATEGORIA",
        titulo: "Categoria concentrando muitos gastos",
        descricao: `${topCategoria.categoria} representa ${topCategoria.percentual}% das despesas do periodo.`,
        severidade: topCategoria.percentual >= 45 ? "alta" : "media",
      });
    }

    const nivelAtencao = defineNivelAtencao(gargalos);

    const dicas = gargalos.length > 0
      ? gargalos.map((gargalo) => {
          switch (gargalo.codigo) {
            case "COMPROMETIMENTO_RENDA":
              return "Revise os maiores gastos variaveis do periodo antes de criar novas despesas.";
            case "GASTOS_ATRASADOS":
              return "Priorize quitar os itens atrasados para reduzir o efeito bola de neve no proximo mes.";
            case "GASTOS_PENDENTES":
              return "Monte uma ordem de pagamento para os pendentes, priorizando vencimentos mais proximos.";
            case "ALTA_DESPESAS":
              return "Compare o periodo atual com o anterior para identificar quais categorias puxaram o aumento.";
            case "CONCENTRACAO_CATEGORIA":
              return `Revise a categoria ${topCategoria?.categoria} e veja se existe gasto recorrente que pode ser reduzido.`;
            default:
              return "Acompanhe seus gastos com mais frequencia para evitar acumulacao.";
          }
        })
      : [
          "Seus gastos estao equilibrados no periodo. Continue acompanhando as categorias com maior valor para manter o controle.",
        ];

    const resumo = gargalos.length > 0
      ? `Foram encontrados ${gargalos.length} ponto(s) de atencao no periodo analisado.`
      : "Nao encontramos gargalos relevantes no periodo analisado.";

    return {
      agente: {
        nome: "Radar",
        versao: "mvp",
      },
      periodo: {
        de,
        ate,
        comparativoAnterior: {
          de: previousStart.toISOString().slice(0, 10),
          ate: previousEnd.toISOString().slice(0, 10),
        },
      },
      nivelAtencao,
      resumo,
      indicadores: {
        totalReceita,
        totalDespesa,
        saldo,
        percentualUsoReceita,
        variacaoDespesas,
        quantidadePendentes,
        valorPendentes,
        quantidadeAtrasados,
        valorAtrasados,
      },
      topCategorias: topCategorias.map((categoria) => ({
        categoria: categoria.categoria,
        totalGasto: categoria.totalGasto,
        quantidadeGastos: categoria.quantidadeGastos,
      })),
      gargalos,
      dicas,
    };
  }
}

export const insightsService = new InsightsService();
