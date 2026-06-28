import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import iCriarCartaoCredito from "../../@types/cartaoCredito/iCriarCartaoCredito";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { CartaoCreditoRepositoryPort } from "../../ports/outbound/cartaoCreditoRepositoryPort";

export class PrismaCartaoCreditoRepository implements CartaoCreditoRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async criarCartaoCredito(usuarioId: string, cartao: iCriarCartaoCredito) {
    try {
      return await this.prisma.cartaoCredito.create({
        data: {
          descricao: cartao.descricao,
          diaFechamento: cartao.diaFechamento,
          diaVencimento: cartao.diaVencimento,
          valorLimite: cartao.valorLimite,
          observacoes: cartao.observacoes?.trim() || null,
          usuarioId,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o cartao de credito.");
    }
  }

  async listarCartoesCreditoPorUsuario(usuarioId: string) {
    try {
      const contasConjuntas = await this.prisma.contaConjunta.findMany({
        where: {
          deletedAt: null,
          OR: [{ usuario1Id: usuarioId }, { usuario2Id: usuarioId }],
        },
        select: {
          usuario1Id: true,
          usuario2Id: true,
        },
      });

      const usuariosPermitidos = new Set<string>([usuarioId]);

      for (const conta of contasConjuntas) {
        usuariosPermitidos.add(conta.usuario1Id === usuarioId ? conta.usuario2Id : conta.usuario1Id);
      }

      const cartoes = await this.prisma.cartaoCredito.findMany({
        where: {
          usuarioId: {
            in: Array.from(usuariosPermitidos),
          },
        },
        include: {
          usuario: {
            select: { nome: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return cartoes
        .map((cartao) => ({
          ...cartao,
          valorLimite: Number(cartao.valorLimite),
          usuarioNome: cartao.usuario.nome,
          usuarioEmail: cartao.usuario.email,
          origemCartao: cartao.usuarioId === usuarioId ? "proprio" : "conta_conjunta",
        }))
        .sort((primeiro, segundo) => primeiro.origemCartao.localeCompare(segundo.origemCartao));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar os cartoes de credito.");
    }
  }

  async buscarCartaoCreditoPorId(id: string) {
    try {
      const cartao = await this.prisma.cartaoCredito.findUnique({
        where: { id },
      });

      return cartao ? { ...cartao, valorLimite: Number(cartao.valorLimite) } : null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar o cartao de credito.");
    }
  }

  async atualizarCartaoCredito(id: string, cartao: iCriarCartaoCredito) {
    try {
      const atualizado = await this.prisma.cartaoCredito.update({
        where: { id },
        data: {
          descricao: cartao.descricao,
          diaFechamento: cartao.diaFechamento,
          diaVencimento: cartao.diaVencimento,
          valorLimite: cartao.valorLimite,
          observacoes: cartao.observacoes?.trim() || null,
        },
      });

      return {
        ...atualizado,
        valorLimite: Number(atualizado.valorLimite),
      };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel atualizar o cartao de credito.");
    }
  }
}

export const cartaoCreditoRepository = new PrismaCartaoCreditoRepository();
