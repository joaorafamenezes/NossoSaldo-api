import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../lib/prisma";
import {
  MovimentoProjecaoPersistido,
  RelatorioRepositoryPort,
  VisibilidadeProjecaoAnual,
} from "../../ports/outbound/relatorioRepositoryPort";

function formatReferencia(date: Date | null) {
  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const STATUS_PROJECAO = ["pago", "pendente", "atrasado"] as const;

function referenciaUtc(data: Date | null | undefined): { ano: number; mes: number } | null {
  if (!data || Number.isNaN(data.getTime())) {
    return null;
  }

  return { ano: data.getUTCFullYear(), mes: data.getUTCMonth() + 1 };
}

function visibilidadeDoGasto(visibilidade: VisibilidadeProjecaoAnual) {
  if (!visibilidade.contaConjunta) {
    return { responsavelId: visibilidade.usuarioLogadoId };
  }

  return {
    responsavelId: { in: visibilidade.responsavelIds },
    OR: [
      { responsavelId: visibilidade.usuarioLogadoId },
      {
        responsavelId: { not: visibilidade.usuarioLogadoId },
        naoCompartilhar: false,
      },
    ],
  };
}

type PaidMovement = {
  referencia: string;
  valor: number;
  tipo: string;
  categoria: string;
  responsavelId: string;
};

export class PrismaRelatorioRepository implements RelatorioRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  private async listarMovimentosPagos(
    de: Date,
    ate: Date,
    whereGasto: Record<string, unknown>,
    whereLancamentoGasto: Record<string, unknown>,
  ): Promise<PaidMovement[]> {
    const [gastosPagos, parcelasPagas] = await Promise.all([
      this.prisma.gasto.findMany({
        where: {
          ...whereGasto,
          deletedAt: null,
          status: "pago",
          origemLancamento: { not: "parcelado" },
          dataPagamento: { gte: de, lte: ate },
        },
        select: {
          tipo: true,
          valor: true,
          dataPagamento: true,
          responsavelId: true,
          categoria: {
            select: { descricao: true },
          },
        },
      }),
      this.prisma.lancamentoBase.findMany({
        where: {
          status: "pago",
          dataPagamentoParcela: { gte: de, lte: ate },
          gasto: {
            ...whereLancamentoGasto,
            deletedAt: null,
          },
        },
        select: {
          valorParcela: true,
          dataPagamentoParcela: true,
          gasto: {
            select: {
              tipo: true,
              responsavelId: true,
              categoria: {
                select: { descricao: true },
              },
            },
          },
        },
      }),
    ]);

    return [
      ...gastosPagos.map((gasto) => ({
        referencia: formatReferencia(gasto.dataPagamento),
        valor: Number(gasto.valor),
        tipo: gasto.tipo,
        categoria: gasto.categoria?.descricao ?? "Sem categoria",
        responsavelId: gasto.responsavelId,
      })),
      ...parcelasPagas.map((parcela) => ({
        referencia: formatReferencia(parcela.dataPagamentoParcela),
        valor: Number(parcela.valorParcela),
        tipo: parcela.gasto.tipo,
        categoria: parcela.gasto.categoria?.descricao ?? "Sem categoria",
        responsavelId: parcela.gasto.responsavelId,
      })),
    ];
  }

  async gerarRelatorioEvolucaoMensal(de: Date, ate: Date, userId: string) {
    const gastos = await this.listarMovimentosPagos(
      de,
      ate,
      { responsavelId: userId, tipo: "despesa" },
      { responsavelId: userId, tipo: "despesa" },
    );

    const acumulado = new Map<string, number>();

    for (const gasto of gastos) {
      acumulado.set(gasto.referencia, (acumulado.get(gasto.referencia) ?? 0) + gasto.valor);
    }

    return Array.from(acumulado.entries())
      .sort(([primeiro], [segundo]) => primeiro.localeCompare(segundo))
      .map(([referencia, total_gasto]) => ({ referencia, total_gasto }));
  }

  async gerarRelatorioComparativoMensal(mesAtual: Date, mesAnterior: Date, userId: string) {
    const gastos = await this.listarMovimentosPagos(
      mesAnterior,
      mesAtual,
      { responsavelId: userId },
      { responsavelId: userId },
    );

    const acumulado = new Map<string, { total_despesa: number; total_receita: number }>();

    for (const gasto of gastos) {
      const referencia = gasto.referencia;
      const atual = acumulado.get(referencia) ?? { total_despesa: 0, total_receita: 0 };
      const valor = gasto.valor;

      if (gasto.tipo === "despesa") {
        atual.total_despesa += valor;
      } else {
        atual.total_receita += valor;
      }

      acumulado.set(referencia, atual);
    }

    return Array.from(acumulado.entries())
      .sort(([primeiro], [segundo]) => primeiro.localeCompare(segundo))
      .map(([referencia, totais]) => ({ referencia, ...totais }));
  }

  async gerarRelatorioTopCategoria(de: Date, ate: Date, userId: string) {
    const gastos = await this.listarMovimentosPagos(
      de,
      ate,
      { responsavelId: userId, tipo: "despesa" },
      { responsavelId: userId, tipo: "despesa" },
    );

    const acumulado = new Map<string, number>();

    for (const gasto of gastos) {
      acumulado.set(gasto.categoria, (acumulado.get(gasto.categoria) ?? 0) + gasto.valor);
    }

    return Array.from(acumulado.entries())
      .sort((primeiro, segundo) => segundo[1] - primeiro[1])
      .slice(0, 5)
      .map(([categoria, total_gasto]) => ({ categoria, total_gasto }));
  }

  async gerarRelatorioQuemGastaMais(
    de: Date,
    ate: Date,
    usuarioLogadoId: string,
    usuario1Id: string,
    usuario2Id: string,
  ) {
    const gastos = await this.listarMovimentosPagos(
      de,
      ate,
      {
        tipo: "despesa",
        responsavelId: { in: [usuario1Id, usuario2Id] },
        OR: [
          { responsavelId: usuarioLogadoId },
          {
            responsavelId: { not: usuarioLogadoId },
            naoCompartilhar: false,
          },
        ],
      },
      {
        tipo: "despesa",
        responsavelId: { in: [usuario1Id, usuario2Id] },
        OR: [
          { responsavelId: usuarioLogadoId },
          {
            responsavelId: { not: usuarioLogadoId },
            naoCompartilhar: false,
          },
        ],
      },
    );

    const acumulado = new Map<string, number>();

    for (const gasto of gastos) {
      acumulado.set(gasto.responsavelId, (acumulado.get(gasto.responsavelId) ?? 0) + gasto.valor);
    }

    return Array.from(acumulado.entries()).map(([usuario_id, total_gasto]) => ({ usuario_id, total_gasto }));
  }

  async listarMovimentosProjecaoAnual(visibilidade: VisibilidadeProjecaoAnual): Promise<MovimentoProjecaoPersistido[]> {
    const filtroResponsavel = visibilidadeDoGasto(visibilidade);
    const [gastos, parcelas] = await Promise.all([
      this.prisma.gasto.findMany({
        where: {
          ...filtroResponsavel,
          deletedAt: null,
          status: { in: [...STATUS_PROJECAO] },
          origemLancamento: { not: "parcelado" },
        },
        select: {
          tipo: true,
          valor: true,
          competencia: true,
          dataVencimento: true,
          responsavelId: true,
          categoriaId: true,
          categoria: { select: { descricao: true } },
        },
      }),
      this.prisma.lancamentoBase.findMany({
        where: {
          status: { in: [...STATUS_PROJECAO] },
          gasto: {
            ...filtroResponsavel,
            deletedAt: null,
            origemLancamento: "parcelado",
          },
        },
        select: {
          valorParcela: true,
          competencia: true,
          gasto: {
            select: {
              tipo: true,
              responsavelId: true,
              categoriaId: true,
              categoria: { select: { descricao: true } },
            },
          },
        },
      }),
    ]);

    const movimentos: MovimentoProjecaoPersistido[] = [];

    for (const gasto of gastos) {
      const referencia = referenciaUtc(gasto.competencia) ?? referenciaUtc(gasto.dataVencimento);
      if (!referencia || (gasto.tipo !== "receita" && gasto.tipo !== "despesa")) {
        continue;
      }

      movimentos.push({
        tipo: gasto.tipo,
        valor: Number(gasto.valor),
        ano: referencia.ano,
        mes: referencia.mes,
        categoriaId: gasto.categoriaId,
        categoriaNome: gasto.categoria?.descricao ?? "Sem categoria",
        responsavelId: gasto.responsavelId,
      });
    }

    for (const parcela of parcelas) {
      const referencia = referenciaUtc(parcela.competencia);
      if (!referencia || (parcela.gasto.tipo !== "receita" && parcela.gasto.tipo !== "despesa")) {
        continue;
      }

      movimentos.push({
        tipo: parcela.gasto.tipo,
        valor: Number(parcela.valorParcela),
        ano: referencia.ano,
        mes: referencia.mes,
        categoriaId: parcela.gasto.categoriaId,
        categoriaNome: parcela.gasto.categoria?.descricao ?? "Sem categoria",
        responsavelId: parcela.gasto.responsavelId,
      });
    }

    return movimentos;
  }
}

export const relatorioRepository = new PrismaRelatorioRepository();
