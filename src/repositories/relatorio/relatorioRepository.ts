import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { RelatorioRepositoryPort } from "../../ports/outbound/relatorioRepositoryPort";

function formatReferencia(date: Date | null) {
  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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
}

export const relatorioRepository = new PrismaRelatorioRepository();
