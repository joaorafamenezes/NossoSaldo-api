import { PrismaClient, Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "../../lib/prisma";
import {
  iCriarRecorrencia,
  iAtualizarRecorrencia,
  iPausarRecorrencia,
  iFiltroRecorrencias,
} from "../../@types/recorrencia/iRecorrencia";
import { RecorrenciaRepositoryPort } from "../../ports/outbound/recorrenciaRepositoryPort";

function createRepositoryError(error: unknown, defaultMessage: string) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(defaultMessage);
}

async function listarUsuariosCompartilhados(prisma: PrismaClient | Prisma.TransactionClient, responsavelId: string) {
  const contasConjuntas = await prisma.contaConjunta.findMany({
    where: {
      deletedAt: null,
      OR: [{ usuario1Id: responsavelId }, { usuario2Id: responsavelId }],
    },
    select: {
      usuario1Id: true,
      usuario2Id: true,
    },
  });

  return Array.from(new Set(
    contasConjuntas.map((conta) => (conta.usuario1Id === responsavelId ? conta.usuario2Id : conta.usuario1Id)),
  ));
}

export class PrismaRecorrenciaRepository implements RecorrenciaRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async criarRecorrencia(data: iCriarRecorrencia) {
    try {
      return await this.prisma.recorrencia.create({
        data: {
          descricao: data.descricao,
          tipo: data.tipo,
          valor: data.valor,
          diaVencimento: data.diaVencimento,
          frequencia: data.frequencia ?? "mensal",
          dataInicio: new Date(data.dataInicio),
          dataFim: data.dataFim ? new Date(data.dataFim) : null,
          naoCompartilhar: data.naoCompartilhar ?? false,
          observacao: data.observacao ?? null,
          categoriaId: data.categoriaId,
          responsavelId: data.responsavelId,
          cartaoCreditoId: data.cartaoCreditoId || null,
        },
        include: {
          categoria: true,
          responsavel: { select: { id: true, nome: true, email: true } },
          cartaoCredito: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar a recorrencia.");
    }
  }

  async buscarRecorrenciaPorId(id: string) {
    try {
      return await this.prisma.recorrencia.findFirst({
        where: { id, deletedAt: null },
        include: {
          categoria: true,
          responsavel: { select: { id: true, nome: true, email: true } },
          cartaoCredito: true,
          gastos: {
            where: { deletedAt: null },
            orderBy: { dataVencimento: "desc" },
            take: 12,
          },
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar a recorrencia.");
    }
  }

  async listarRecorrenciasPorUsuario(responsavelId: string, filtros?: iFiltroRecorrencias) {
    try {
      const usuariosCompartilhadosIds = await listarUsuariosCompartilhados(this.prisma, responsavelId);

      const whereClause: Prisma.RecorrenciaWhereInput = {
        deletedAt: null,
        OR: [
          { responsavelId },
          ...(usuariosCompartilhadosIds.length > 0
            ? [{ responsavelId: { in: usuariosCompartilhadosIds }, naoCompartilhar: false }]
            : []),
        ],
      };

      if (filtros?.tipo) {
        whereClause.tipo = filtros.tipo;
      }

      if (filtros?.categoriaId) {
        whereClause.categoriaId = filtros.categoriaId;
      }

      if (filtros?.status === "ativa") {
        whereClause.pausado = false;
        whereClause.OR = [
          { dataFim: null },
          { dataFim: { gte: new Date() } },
        ];
      } else if (filtros?.status === "pausada") {
        whereClause.pausado = true;
      }

      const recorrencias = await this.prisma.recorrencia.findMany({
        where: whereClause,
        include: {
          categoria: { select: { id: true, descricao: true, iconName: true, cor: true } },
          responsavel: { select: { id: true, nome: true, email: true } },
          cartaoCredito: { select: { id: true, descricao: true, bandeira: true, ultimosDigitos: true } },
          _count: {
            select: { gastos: { where: { deletedAt: null } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return recorrencias.map((r) => ({
        ...r,
        valor: Number(r.valor),
        totalGastosGerados: r._count.gastos,
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as recorrencias.");
    }
  }

  async listarRecorrenciasAtivasNoPeriodo(responsaveisIds: string[], de: Date, ate: Date) {
    try {
      if (responsaveisIds.length === 0) {
        return [];
      }

      const recorrencias = await this.prisma.recorrencia.findMany({
        where: {
          deletedAt: null,
          responsavelId: { in: responsaveisIds },
          dataInicio: { lte: ate },
          OR: [
            { dataFim: null },
            { dataFim: { gte: de } },
          ],
        },
        include: {
          categoria: { select: { id: true, descricao: true, iconName: true, cor: true } },
          responsavel: { select: { id: true, nome: true, email: true } },
          cartaoCredito: { select: { id: true, descricao: true, bandeira: true, ultimosDigitos: true } },
        },
      });

      return recorrencias.map((r) => ({
        ...r,
        valor: Number(r.valor),
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as recorrencias ativas no periodo.");
    }
  }

  async atualizarRecorrencia(id: string, data: iAtualizarRecorrencia) {
    try {
      return await this.prisma.recorrencia.update({
        where: { id },
        data: {
          descricao: data.descricao,
          tipo: data.tipo,
          valor: data.valor !== undefined ? data.valor : undefined,
          diaVencimento: data.diaVencimento,
          frequencia: data.frequencia,
          dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
          dataFim: data.dataFim !== undefined ? (data.dataFim ? new Date(data.dataFim) : null) : undefined,
          naoCompartilhar: data.naoCompartilhar,
          observacao: data.observacao !== undefined ? data.observacao : undefined,
          categoriaId: data.categoriaId,
          cartaoCreditoId: data.cartaoCreditoId !== undefined ? (data.cartaoCreditoId || null) : undefined,
        },
        include: {
          categoria: true,
          responsavel: { select: { id: true, nome: true, email: true } },
          cartaoCredito: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel atualizar a recorrencia.");
    }
  }

  async pausarRecorrencia(id: string, data: iPausarRecorrencia) {
    try {
      return await this.prisma.recorrencia.update({
        where: { id },
        data: {
          pausado: true,
          dataPausaInicio: data.dataPausaInicio ? new Date(data.dataPausaInicio) : new Date(),
          dataPausaFim: data.dataPausaFim ? new Date(data.dataPausaFim) : null,
          motivoPausa: data.motivoPausa ?? null,
        },
        include: {
          categoria: true,
          responsavel: { select: { id: true, nome: true, email: true } },
          cartaoCredito: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel pausar a recorrencia.");
    }
  }

  async retomarRecorrencia(id: string) {
    try {
      return await this.prisma.recorrencia.update({
        where: { id },
        data: {
          pausado: false,
          dataPausaInicio: null,
          dataPausaFim: null,
          motivoPausa: null,
        },
        include: {
          categoria: true,
          responsavel: { select: { id: true, nome: true, email: true } },
          cartaoCredito: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel retomar a recorrencia.");
    }
  }

  async deletarRecorrencia(id: string) {
    try {
      return await this.prisma.recorrencia.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          dataFim: new Date(),
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel excluir a recorrencia.");
    }
  }
}

export const recorrenciaRepository = new PrismaRecorrenciaRepository();
