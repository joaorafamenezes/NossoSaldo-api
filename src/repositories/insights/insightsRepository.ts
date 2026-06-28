import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { InsightExpenseRow, InsightsRepositoryPort } from "../../ports/outbound/insightsRepositoryPort";

export class PrismaInsightsRepository implements InsightsRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async listarGastosPorPeriodo(de: Date, ate: Date, userId: string): Promise<InsightExpenseRow[]> {
    try {
      const gastos = await this.prisma.gasto.findMany({
        where: {
          competencia: {
            gte: de,
            lte: ate,
          },
          responsavelId: userId,
          deletedAt: null,
        },
        include: {
          categoria: {
            select: { descricao: true },
          },
        },
        orderBy: [{ competencia: "asc" }, { createdAt: "asc" }],
      });

      return gastos.map((gasto) => ({
        id: gasto.id,
        tipo: gasto.tipo,
        status: gasto.status,
        valor: Number(gasto.valor),
        competencia: gasto.competencia,
        categoriaId: gasto.categoriaId,
        categoriaDescricao: gasto.categoria?.descricao ?? null,
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar os gastos do periodo para os insights.");
    }
  }
}

export const insightsRepository = new PrismaInsightsRepository();
