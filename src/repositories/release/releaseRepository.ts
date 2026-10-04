import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { createRepositoryError } from "../../errors/httpError";

export class PrismaReleaseRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async buscarVersoesVisualizadas(usuarioId: string) {
    try {
      return await this.prisma.usuarioReleaseView.findMany({
        where: { usuarioId },
        orderBy: { visualizadoEm: "desc" },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar as versoes visualizadas do usuario.");
    }
  }

  async marcarVersaoVisualizada(usuarioId: string, versao: string) {
    try {
      return await this.prisma.usuarioReleaseView.upsert({
        where: {
          usuarioId_versao: {
            usuarioId,
            versao,
          },
        },
        update: {
          visualizadoEm: new Date(),
        },
        create: {
          usuarioId,
          versao,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel registrar visualizacao da versao.");
    }
  }
}

export const releaseRepository = new PrismaReleaseRepository();
