import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { IaConversaRepositoryPort, NovaIaConversa } from "../../ports/outbound/iaConversaRepositoryPort";

export class PrismaIaConversaRepository implements IaConversaRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async criar(conversa: NovaIaConversa) {
    try {
      return await this.prisma.iaConversa.create({ data: conversa });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel salvar o historico da IA.");
    }
  }

  async listarPorUsuarioId(usuarioId: string, limite: number) {
    try {
      return await this.prisma.iaConversa.findMany({
        where: { usuarioId },
        orderBy: { createdAt: "desc" },
        take: limite,
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar o historico da IA.");
    }
  }

  async removerPorUsuarioId(usuarioId: string) {
    try {
      await this.prisma.iaConversa.deleteMany({ where: { usuarioId } });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel remover o historico da IA.");
    }
  }
}

export const iaConversaRepository = new PrismaIaConversaRepository();
