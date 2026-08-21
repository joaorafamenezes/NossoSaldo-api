import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { IaConfiguracaoPersistida, IaConfiguracaoRepositoryPort } from "../../ports/outbound/iaConfiguracaoRepositoryPort";

export class PrismaIaConfiguracaoRepository implements IaConfiguracaoRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async salvar(configuracao: Omit<IaConfiguracaoPersistida, "createdAt" | "updatedAt">) {
    try {
      return await this.prisma.iaConfiguracao.upsert({
        where: { usuarioId: configuracao.usuarioId },
        create: configuracao,
        update: {
          provedor: configuracao.provedor,
          modelo: configuracao.modelo,
          chaveCriptografada: configuracao.chaveCriptografada,
          iv: configuracao.iv,
          authTag: configuracao.authTag,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel salvar a configuracao de IA.");
    }
  }

  async buscarPorUsuarioId(usuarioId: string) {
    try {
      return await this.prisma.iaConfiguracao.findUnique({ where: { usuarioId } });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar a configuracao de IA.");
    }
  }

  async removerPorUsuarioId(usuarioId: string) {
    try {
      await this.prisma.iaConfiguracao.deleteMany({ where: { usuarioId } });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel remover a configuracao de IA.");
    }
  }
}

export const iaConfiguracaoRepository = new PrismaIaConfiguracaoRepository();
