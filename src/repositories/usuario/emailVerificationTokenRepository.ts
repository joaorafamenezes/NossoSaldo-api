import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";

const prisma = new PrismaClient();

type CriarEmailVerificationTokenInput = {
  tokenHash: string;
  usuarioId: string;
  expiresAt: Date;
};

type EmailVerificationTokenRecord = {
  id: string;
  tokenHash: string;
  usuarioId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

class EmailVerificationTokenRepository {
  async invalidarTokensAtivosPorUsuarioId(usuarioId: string) {
    try {
      const usedAt = new Date();
      const count = await prisma.$executeRaw`
        UPDATE EmailVerificationToken
        SET usedAt = ${usedAt}
        WHERE usuarioId = ${usuarioId} AND usedAt IS NULL
      `;

      return { count: Number(count) };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel invalidar os tokens de verificacao de email.");
    }
  }

  async criarToken(input: CriarEmailVerificationTokenInput) {
    try {
      const id = randomUUID();
      const createdAt = new Date();

      await prisma.$executeRaw`
        INSERT INTO EmailVerificationToken (id, tokenHash, usuarioId, expiresAt, createdAt)
        VALUES (${id}, ${input.tokenHash}, ${input.usuarioId}, ${input.expiresAt}, ${createdAt})
      `;

      return {
        id,
        ...input,
        usedAt: null,
        createdAt,
      };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o token de verificacao de email.");
    }
  }

  async buscarTokenValidoPorHash(tokenHash: string, referencia = new Date()) {
    try {
      const registros = await prisma.$queryRaw<EmailVerificationTokenRecord[]>`
        SELECT id, tokenHash, usuarioId, expiresAt, usedAt, createdAt
        FROM EmailVerificationToken
        WHERE tokenHash = ${tokenHash}
          AND usedAt IS NULL
          AND expiresAt > ${referencia}
        LIMIT 1
      `;

      return registros[0] ?? null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel validar o token de verificacao de email.");
    }
  }

  async marcarTokenComoUsado(id: string) {
    try {
      const usedAt = new Date();

      await prisma.$executeRaw`
        UPDATE EmailVerificationToken
        SET usedAt = ${usedAt}
        WHERE id = ${id}
      `;

      return { id, usedAt };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel marcar o token de verificacao como usado.");
    }
  }
}

export const emailVerificationTokenRepository = new EmailVerificationTokenRepository();
