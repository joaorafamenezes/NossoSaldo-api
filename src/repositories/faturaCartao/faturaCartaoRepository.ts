import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { CartaoFaturaInput, FaturaCartaoRepositoryPort } from "../../ports/outbound/faturaCartaoRepositoryPort";

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function createDateKeepingMonth(year: number, month: number, day: number) {
  const safeDay = Math.min(day, getLastDayOfMonth(year, month));
  return new Date(year, month, safeDay);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatCompetencia(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function calcularPeriodoFatura(cartao: CartaoFaturaInput, dataReferencia: Date) {
  const referencia = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), dataReferencia.getDate());
  const mesCompetencia = referencia.getDate() <= cartao.diaFechamento
    ? new Date(referencia.getFullYear(), referencia.getMonth(), 1)
    : addMonths(referencia, 1);

  const dataFechamento = createDateKeepingMonth(mesCompetencia.getFullYear(), mesCompetencia.getMonth(), cartao.diaFechamento);
  const mesVencimento = cartao.diaVencimento > cartao.diaFechamento ? mesCompetencia : addMonths(mesCompetencia, 1);
  const dataVencimento = createDateKeepingMonth(mesVencimento.getFullYear(), mesVencimento.getMonth(), cartao.diaVencimento);
  const fechamentoAnterior = createDateKeepingMonth(mesCompetencia.getFullYear(), mesCompetencia.getMonth() - 1, cartao.diaFechamento);
  const dataAbertura = new Date(fechamentoAnterior);
  dataAbertura.setDate(dataAbertura.getDate() + 1);

  return { competencia: formatCompetencia(mesCompetencia), dataAbertura, dataFechamento, dataVencimento };
}

function calcularPeriodoFaturaPorCompetencia(cartao: CartaoFaturaInput, competenciaReferencia: Date) {
  const mesCompetencia = new Date(competenciaReferencia.getFullYear(), competenciaReferencia.getMonth(), 1);
  const dataFechamento = createDateKeepingMonth(mesCompetencia.getFullYear(), mesCompetencia.getMonth(), cartao.diaFechamento);
  const mesVencimento = cartao.diaVencimento > cartao.diaFechamento ? mesCompetencia : addMonths(mesCompetencia, 1);
  const dataVencimento = createDateKeepingMonth(mesVencimento.getFullYear(), mesVencimento.getMonth(), cartao.diaVencimento);
  const fechamentoAnterior = createDateKeepingMonth(mesCompetencia.getFullYear(), mesCompetencia.getMonth() - 1, cartao.diaFechamento);
  const dataAbertura = new Date(fechamentoAnterior);
  dataAbertura.setDate(dataAbertura.getDate() + 1);

  return { competencia: formatCompetencia(mesCompetencia), dataAbertura, dataFechamento, dataVencimento };
}

async function listarUsuariosPermitidos(prisma: PrismaClient, usuarioId: string) {
  const contas = await prisma.contaConjunta.findMany({
    where: { deletedAt: null, OR: [{ usuario1Id: usuarioId }, { usuario2Id: usuarioId }] },
    select: { usuario1Id: true, usuario2Id: true },
  });

  const ids = new Set<string>([usuarioId]);
  for (const conta of contas) {
    ids.add(conta.usuario1Id === usuarioId ? conta.usuario2Id : conta.usuario1Id);
  }

  return Array.from(ids);
}

export class PrismaFaturaCartaoRepository implements FaturaCartaoRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async buscarFaturaPorIdParaUsuario(faturaId: string, usuarioId: string) {
    try {
      const usuariosPermitidos = await listarUsuariosPermitidos(this.prisma, usuarioId);
      const fatura = await this.prisma.faturaCartao.findFirst({
        where: {
          id: faturaId,
          cartaoCredito: {
            usuarioId: { in: usuariosPermitidos },
          },
        },
        include: {
          cartaoCredito: {
            include: {
              usuario: { select: { id: true, nome: true, email: true } },
            },
          },
        },
      });

      if (!fatura) {
        return null;
      }

      return {
        ...fatura,
        valorTotal: Number(fatura.valorTotal),
        cartaoDescricao: fatura.cartaoCredito.descricao,
        cartaoValorLimite: Number(fatura.cartaoCredito.valorLimite),
        cartaoUsuarioId: fatura.cartaoCredito.usuario.id,
        cartaoUsuarioNome: fatura.cartaoCredito.usuario.nome,
        cartaoUsuarioEmail: fatura.cartaoCredito.usuario.email,
        origemCartao: fatura.cartaoCredito.usuarioId === usuarioId ? "proprio" : "conta_conjunta",
      };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar a fatura do cartao.");
    }
  }

  async listarFaturasPorUsuario(usuarioId: string, cartaoCreditoId?: string) {
    try {
      const usuariosPermitidos = await listarUsuariosPermitidos(this.prisma, usuarioId);
      const faturas = await this.prisma.faturaCartao.findMany({
        where: {
          ...(cartaoCreditoId ? { cartaoCreditoId } : {}),
          cartaoCredito: {
            usuarioId: { in: usuariosPermitidos },
          },
        },
        include: {
          cartaoCredito: {
            include: {
              usuario: { select: { id: true, nome: true, email: true } },
            },
          },
          gastos: {
            where: { deletedAt: null },
            select: { id: true },
          },
          lancamentosBase: {
            where: {
              gasto: {
                deletedAt: null,
              },
            },
            select: { id: true },
          },
        },
        orderBy: { dataVencimento: "desc" },
      });

      return faturas.map((fatura) => ({
        ...fatura,
        valorTotal: Number(fatura.valorTotal),
        cartaoDescricao: fatura.cartaoCredito.descricao,
        cartaoValorLimite: Number(fatura.cartaoCredito.valorLimite),
        cartaoUsuarioId: fatura.cartaoCredito.usuario.id,
        cartaoUsuarioNome: fatura.cartaoCredito.usuario.nome,
        cartaoUsuarioEmail: fatura.cartaoCredito.usuario.email,
        origemCartao: fatura.cartaoCredito.usuarioId === usuarioId ? "proprio" : "conta_conjunta",
        totalGastos: fatura.gastos.length + fatura.lancamentosBase.length,
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as faturas do cartao.");
    }
  }

  async buscarOuCriarFatura(cartao: CartaoFaturaInput, dataReferencia: Date) {
    try {
      return await this.buscarOuCriarFaturaPorPeriodo(cartao, calcularPeriodoFatura(cartao, dataReferencia));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar ou criar a fatura do cartao.");
    }
  }

  async buscarOuCriarFaturaPorCompetencia(cartao: CartaoFaturaInput, competenciaReferencia: Date) {
    try {
      return await this.buscarOuCriarFaturaPorPeriodo(cartao, calcularPeriodoFaturaPorCompetencia(cartao, competenciaReferencia));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar ou criar a fatura do cartao.");
    }
  }

  private async buscarOuCriarFaturaPorPeriodo(cartao: CartaoFaturaInput, periodo: ReturnType<typeof calcularPeriodoFatura>) {
    const fatura = await this.prisma.faturaCartao.upsert({
      where: {
        cartaoCreditoId_competencia: {
          cartaoCreditoId: cartao.id,
          competencia: periodo.competencia,
        },
      },
      create: {
        cartaoCreditoId: cartao.id,
        competencia: periodo.competencia,
        dataAbertura: periodo.dataAbertura,
        dataFechamento: periodo.dataFechamento,
        dataVencimento: periodo.dataVencimento,
        valorTotal: 0,
        status: "aberta",
      },
      update: {},
    });

    return { ...fatura, valorTotal: Number(fatura.valorTotal) };
  }

  async recalcularValorTotal(faturaCartaoId: string) {
    try {
      const [gastos, lancamentos] = await Promise.all([
        this.prisma.gasto.aggregate({
          _sum: { valor: true },
          where: {
            faturaCartaoId,
            deletedAt: null,
            tipo: "despesa",
            status: { not: "cancelado" },
            origemLancamento: { not: "parcelado" },
          },
        }),
        this.prisma.lancamentoBase.aggregate({
          _sum: { valorParcela: true },
          where: {
            faturaCartaoId,
            gasto: {
              deletedAt: null,
              tipo: "despesa",
              status: { not: "cancelado" },
            },
          },
        }),
      ]);

      const valorTotal = Number(gastos._sum.valor ?? 0) + Number(lancamentos._sum.valorParcela ?? 0);
      const fatura = await this.prisma.faturaCartao.update({
        where: { id: faturaCartaoId },
        data: { valorTotal },
      });

      return { ...fatura, valorTotal: Number(fatura.valorTotal) };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel recalcular o valor total da fatura.");
    }
  }

  async pagarFatura(faturaCartaoId: string, dataPagamento: Date) {
    try {
      const fatura = await this.prisma.$transaction(async (transaction) => {
        await transaction.faturaCartao.update({
          where: { id: faturaCartaoId },
          data: { status: "paga", dataPagamento },
        });

        await transaction.gasto.updateMany({
          where: {
            faturaCartaoId,
            deletedAt: null,
            status: { not: "cancelado" },
            origemLancamento: { not: "parcelado" },
          },
          data: { status: "pago", dataPagamento },
        });

        await transaction.lancamentoBase.updateMany({
          where: {
            faturaCartaoId,
            gasto: {
              deletedAt: null,
              status: { not: "cancelado" },
            },
          },
          data: { status: "pago", dataPagamentoParcela: dataPagamento },
        });

        const gastosParcelados = await transaction.gasto.findMany({
          where: {
            origemLancamento: "parcelado",
            deletedAt: null,
            status: { not: "cancelado" },
            lancamentosBase: { some: { faturaCartaoId } },
          },
          include: { lancamentosBase: true },
        });

        for (const gasto of gastosParcelados) {
          const todasPagas = gasto.lancamentosBase.every((parcela) => parcela.status === "pago");
          if (todasPagas) {
            await transaction.gasto.update({
              where: { id: gasto.id },
              data: { status: "pago", dataPagamento: gasto.dataPagamento ?? dataPagamento },
            });
          }
        }

        return await transaction.faturaCartao.findUnique({ where: { id: faturaCartaoId } });
      });

      return fatura ? { ...fatura, valorTotal: Number(fatura.valorTotal) } : null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel pagar a fatura do cartao.");
    }
  }

  async reabrirFatura(faturaCartaoId: string) {
    try {
      const fatura = await this.prisma.$transaction(async (transaction) => {
        await transaction.faturaCartao.update({
          where: { id: faturaCartaoId },
          data: { status: "aberta", dataPagamento: null },
        });

        await transaction.gasto.updateMany({
          where: {
            faturaCartaoId,
            deletedAt: null,
            status: { not: "cancelado" },
            origemLancamento: { not: "parcelado" },
          },
          data: { status: "pendente", dataPagamento: null },
        });

        await transaction.lancamentoBase.updateMany({
          where: {
            faturaCartaoId,
            gasto: {
              deletedAt: null,
              status: { not: "cancelado" },
            },
          },
          data: { status: "pendente", dataPagamentoParcela: null },
        });

        const gastosParcelados = await transaction.gasto.findMany({
          where: {
            origemLancamento: "parcelado",
            deletedAt: null,
            status: { not: "cancelado" },
            lancamentosBase: { some: { faturaCartaoId } },
          },
        });

        for (const gasto of gastosParcelados) {
          await transaction.gasto.update({
            where: { id: gasto.id },
            data: { status: "pendente", dataPagamento: null },
          });
        }

        return await transaction.faturaCartao.findUnique({ where: { id: faturaCartaoId } });
      });

      return fatura ? { ...fatura, valorTotal: Number(fatura.valorTotal) } : null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel reabrir a fatura do cartao.");
    }
  }
}

export const faturaCartaoRepository = new PrismaFaturaCartaoRepository();
