import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import {
  CriarEmailVerificationTokenInput,
  EmailVerificationTokenRepositoryPort,
} from "../../ports/outbound/emailVerificationTokenRepositoryPort";

export class PrismaEmailVerificationTokenRepository implements EmailVerificationTokenRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async invalidarTokensAtivosPorUsuarioId(usuarioId: string) {
    try {
      const result = await this.prisma.emailVerificationToken.updateMany({
        where: { usuarioId, usedAt: null },
        data: { usedAt: new Date() },
      });

      return { count: result.count };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel invalidar os tokens de verificacao de email.");
    }
  }

  async criarToken(input: CriarEmailVerificationTokenInput) {
    try {
      return await this.prisma.emailVerificationToken.create({
        data: {
          id: randomUUID(),
          tokenHash: input.tokenHash,
          usuarioId: input.usuarioId,
          expiresAt: input.expiresAt,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o token de verificacao de email.");
    }
  }

  async buscarTokenValidoPorHash(tokenHash: string, referencia = new Date()) {
    try {
      return await this.prisma.emailVerificationToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: referencia },
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel validar o token de verificacao de email.");
    }
  }

  async marcarTokenComoUsado(id: string) {
    try {
      const usedAt = new Date();
      await this.prisma.emailVerificationToken.update({
        where: { id },
        data: { usedAt },
      });

      return { id, usedAt };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel marcar o token de verificacao como usado.");
    }
  }
}

export const emailVerificationTokenRepository = new PrismaEmailVerificationTokenRepository();
