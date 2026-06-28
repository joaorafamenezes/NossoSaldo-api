import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { ContaConjuntaRepositoryPort } from "../../ports/outbound/contaConjuntaRepositoryPort";

export class PrismaContaConjuntaRepository implements ContaConjuntaRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async criarContaConjunta(nomeConta: string, usuarioConjuntoValidado: string, usuarioLogadoValidado: string) {
    try {
      return await this.prisma.contaConjunta.create({
        data: {
          nomeConta,
          usuario1Id: usuarioConjuntoValidado,
          usuario2Id: usuarioLogadoValidado,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar a conta conjunta.");
    }
  }

  async listarContaConjuntaPorIds(usuario1Id: string, usuario2Id: string) {
    try {
      return await this.prisma.contaConjunta.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { usuario1Id, usuario2Id },
            { usuario1Id: usuario2Id, usuario2Id: usuario1Id },
          ],
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar a conta conjunta.");
    }
  }

  async listarContasConjuntasPorUsuarioId(usuarioId: string) {
    try {
      return await this.prisma.contaConjunta.findMany({
        where: {
          deletedAt: null,
          OR: [{ usuario1Id: usuarioId }, { usuario2Id: usuarioId }],
        },
        include: {
          usuario1: { select: { id: true, nome: true, email: true } },
          usuario2: { select: { id: true, nome: true, email: true } },
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as contas conjuntas.");
    }
  }

  async buscarContaConjuntaPorId(id: string) {
    try {
      return await this.prisma.contaConjunta.findFirst({
        where: { id, deletedAt: null },
        include: {
          usuario1: { select: { id: true, nome: true, email: true } },
          usuario2: { select: { id: true, nome: true, email: true } },
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar a conta conjunta.");
    }
  }

  async desvincularContaConjunta(id: string) {
    try {
      return await this.prisma.contaConjunta.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: { id: true, deletedAt: true },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel desvincular a conta conjunta.");
    }
  }
}

export const contaConjuntaRepository = new PrismaContaConjuntaRepository();
