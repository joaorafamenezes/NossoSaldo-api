import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";

const prisma = new PrismaClient();

export type InsightExpenseRow = {
  id: string;
  tipo: string;
  status: string;
  valor: number | string;
  competencia: Date | null;
  categoriaId: string;
  categoriaDescricao: string | null;
};

class InsightsRepository {
  async listarGastosPorPeriodo(de: Date, ate: Date, userId: string): Promise<InsightExpenseRow[]> {
    try {
      return await prisma.$queryRaw<InsightExpenseRow[]>`
        SELECT
          g.id,
          g.tipo,
          g.status,
          g.valor,
          g.competencia,
          g.categoriaId,
          c.descricao AS categoriaDescricao
        FROM Gasto g
        LEFT JOIN Categoria c ON c.id = g.categoriaId
        WHERE g.competencia IS NOT NULL
          AND g.competencia >= ${de}
          AND g.competencia <= ${ate}
          AND g.responsavelId = ${userId}
          AND g.deletedAt IS NULL
        ORDER BY g.competencia ASC, g.createdAt ASC
      `;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar os gastos do periodo para os insights.");
    }
  }
}

export const insightsRepository = new InsightsRepository();
