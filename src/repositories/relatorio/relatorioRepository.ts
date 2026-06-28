import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { RelatorioRepositoryPort } from "../../ports/outbound/relatorioRepositoryPort";

function formatReferencia(date: Date | null) {
  if (!date) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export class PrismaRelatorioRepository implements RelatorioRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async gerarRelatorioEvolucaoMensal(de: Date, ate: Date, userId: string) {
    const gastos = await this.prisma.gasto.findMany({
      where: {
        competencia: { gte: de, lte: ate },
        responsavelId: userId,
        deletedAt: null,
        tipo: "despesa",
      },
      select: {
        competencia: true,
        valor: true,
      },
    });

    const acumulado = new Map<string, number>();

    for (const gasto of gastos) {
      const referencia = formatReferencia(gasto.competencia);
      acumulado.set(referencia, (acumulado.get(referencia) ?? 0) + Number(gasto.valor));
    }

    return Array.from(acumulado.entries())
      .sort(([primeiro], [segundo]) => primeiro.localeCompare(segundo))
      .map(([referencia, total_gasto]) => ({ referencia, total_gasto }));
  }

  async gerarRelatorioComparativoMensal(mesAtual: Date, mesAnterior: Date, userId: string) {
    const gastos = await this.prisma.gasto.findMany({
      where: {
        competencia: { gte: mesAnterior, lte: mesAtual },
        responsavelId: userId,
        deletedAt: null,
      },
      select: {
        competencia: true,
        valor: true,
        tipo: true,
      },
    });

    const acumulado = new Map<string, { total_despesa: number; total_receita: number }>();

    for (const gasto of gastos) {
      const referencia = formatReferencia(gasto.competencia);
      const atual = acumulado.get(referencia) ?? { total_despesa: 0, total_receita: 0 };
      const valor = Number(gasto.valor);

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
    const gastos = await this.prisma.gasto.findMany({
      where: {
        competencia: { gte: de, lte: ate },
        responsavelId: userId,
        deletedAt: null,
        tipo: "despesa",
      },
      include: {
        categoria: {
          select: { descricao: true },
        },
      },
    });

    const acumulado = new Map<string, number>();

    for (const gasto of gastos) {
      const categoria = gasto.categoria?.descricao ?? "Sem categoria";
      acumulado.set(categoria, (acumulado.get(categoria) ?? 0) + Number(gasto.valor));
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
    const gastos = await this.prisma.gasto.findMany({
      where: {
        competencia: { gte: de, lte: ate },
        deletedAt: null,
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
      select: {
        responsavelId: true,
        valor: true,
      },
    });

    const acumulado = new Map<string, number>();

    for (const gasto of gastos) {
      acumulado.set(gasto.responsavelId, (acumulado.get(gasto.responsavelId) ?? 0) + Number(gasto.valor));
    }

    return Array.from(acumulado.entries()).map(([usuario_id, total_gasto]) => ({ usuario_id, total_gasto }));
  }
}

export const relatorioRepository = new PrismaRelatorioRepository();
