import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";

const prisma = new PrismaClient();

type CriarPasswordResetTokenInput = {
  tokenHash: string;
  usuarioId: string;
  expiresAt: Date;
};

type PasswordResetTokenRecord = {
  id: string;
  tokenHash: string;
  usuarioId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

class PasswordResetTokenRepository {
  async invalidarTokensAtivosPorUsuarioId(usuarioId: string) {
    try {
      const usedAt = new Date();
      const count = await prisma.$executeRaw`
        UPDATE PasswordResetToken
        SET usedAt = ${usedAt}
        WHERE usuarioId = ${usuarioId} AND usedAt IS NULL
      `;

      return { count: Number(count) };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel invalidar os tokens de recuperacao.");
    }
  }

  async criarToken(input: CriarPasswordResetTokenInput) {
    try {
      const id = randomUUID();
      const createdAt = new Date();

      await prisma.$executeRaw`
        INSERT INTO PasswordResetToken (id, tokenHash, usuarioId, expiresAt, createdAt)
        VALUES (${id}, ${input.tokenHash}, ${input.usuarioId}, ${input.expiresAt}, ${createdAt})
      `;

      return {
        id,
        ...input,
        usedAt: null,
        createdAt,
      };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o token de recuperacao.");
    }
  }

  async buscarTokenValidoPorHash(tokenHash: string, referencia = new Date()) {
    try {
      const registros = await prisma.$queryRaw<PasswordResetTokenRecord[]>`
        SELECT id, tokenHash, usuarioId, expiresAt, usedAt, createdAt
        FROM PasswordResetToken
        WHERE tokenHash = ${tokenHash}
          AND usedAt IS NULL
          AND expiresAt > ${referencia}
        LIMIT 1
      `;

      return registros[0] ?? null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel validar o token de recuperacao.");
    }
  }

  async marcarTokenComoUsado(id: string) {
    try {
      const usedAt = new Date();

      await prisma.$executeRaw`
        UPDATE PasswordResetToken
        SET usedAt = ${usedAt}
        WHERE id = ${id}
      `;

      return { id, usedAt };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel marcar o token de recuperacao como usado.");
    }
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
