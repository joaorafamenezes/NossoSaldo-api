import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import {
  CriarPasswordResetTokenInput,
  PasswordResetTokenRepositoryPort,
} from "../../ports/outbound/passwordResetTokenRepositoryPort";

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async invalidarTokensAtivosPorUsuarioId(usuarioId: string) {
    try {
      const result = await this.prisma.passwordResetToken.updateMany({
        where: { usuarioId, usedAt: null },
        data: { usedAt: new Date() },
      });

      return { count: result.count };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel invalidar os tokens de recuperacao.");
    }
  }

  async criarToken(input: CriarPasswordResetTokenInput) {
    try {
      return await this.prisma.passwordResetToken.create({
        data: {
          id: randomUUID(),
          tokenHash: input.tokenHash,
          usuarioId: input.usuarioId,
          expiresAt: input.expiresAt,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o token de recuperacao.");
    }
  }

  async buscarTokenValidoPorHash(tokenHash: string, referencia = new Date()) {
    try {
      return await this.prisma.passwordResetToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: referencia },
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel validar o token de recuperacao.");
    }
  }

  async marcarTokenComoUsado(id: string) {
    try {
      const usedAt = new Date();
      await this.prisma.passwordResetToken.update({
        where: { id },
        data: { usedAt },
      });

      return { id, usedAt };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel marcar o token de recuperacao como usado.");
    }
  }
}

export const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository();
