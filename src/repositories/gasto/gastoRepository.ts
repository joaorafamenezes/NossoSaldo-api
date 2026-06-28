import { Prisma, PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { GastoRepositoryPort } from "../../ports/outbound/gastoRepositoryPort";

function addMonthsKeepingDay(date: Date, months: number) {
  const result = new Date(date);
  const targetDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(targetDay, lastDayOfTargetMonth));

  return result;
}

function calculateInstallmentValues(totalValue: number, installments: number) {
  const totalCents = Math.round(Number(totalValue) * 100);
  const baseInstallmentCents = Math.floor(totalCents / installments);
  const remainderCents = totalCents - baseInstallmentCents * installments;

  return Array.from({ length: installments }, (_, index) => {
    const cents = index === installments - 1 ? baseInstallmentCents + remainderCents : baseInstallmentCents;
    return cents / 100;
  });
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function refreshLancamentosBase(transaction: Prisma.TransactionClient, gasto: any) {
  const numeroParcelas = gasto.numeroParcelas ?? 1;
  const dataVencimento = gasto.dataVencimento ? new Date(gasto.dataVencimento) : null;

  if (!dataVencimento || Number.isNaN(dataVencimento.getTime())) {
    throw new Error("Data de vencimento obrigatoria para lancamentos parcelados.");
  }

  const atuais = await transaction.lancamentoBase.findMany({
    where: { gastoId: gasto.id },
    select: {
      numeroParcela: true,
      dataPagamentoParcela: true,
      faturaCartaoId: true,
    },
  });
  const atuaisPorParcela = new Map(atuais.map((item) => [item.numeroParcela, item]));
  const valoresParcelas = calculateInstallmentValues(Number(gasto.valor), numeroParcelas);

  await transaction.lancamentoBase.deleteMany({ where: { gastoId: gasto.id } });

  await transaction.lancamentoBase.createMany({
    data: Array.from({ length: numeroParcelas }, (_, index) => {
      const numeroParcela = index + 1;
      const dataParcela = addMonthsKeepingDay(dataVencimento, index);
      const registroAtual = atuaisPorParcela.get(numeroParcela);

      return {
        gastoId: gasto.id,
        descricao: `${gasto.descricao} - parcela ${numeroParcela}/${numeroParcelas}`,
        valorParcela: valoresParcelas[index],
        numeroParcela,
        dataVencimentoParcela: dataParcela,
        dataPagamentoParcela: registroAtual?.dataPagamentoParcela ?? gasto.dataPagamento ?? null,
        status: gasto.status,
        competencia: dataParcela,
        observacao: gasto.observacao ?? null,
        faturaCartaoId: registroAtual?.faturaCartaoId ?? null,
      };
    }),
  });
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

export class PrismaGastoRepository implements GastoRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async criarGastoUsuarioLogado(gasto: iCriarGasto) {
    try {
      const criado = await this.prisma.$transaction(async (transaction) => {
        const gastoCriado = await transaction.gasto.create({
          data: {
            descricao: gasto.descricao,
            tipo: gasto.tipo,
            status: gasto.status,
            origemLancamento: gasto.origemLancamento,
            numeroParcelas: gasto.numeroParcelas ?? 1,
            naoCompartilhar: gasto.naoCompartilhar ?? false,
            valor: gasto.valor,
            competencia: gasto.competencia ?? null,
            dataVencimento: gasto.dataVencimento ?? null,
            dataPagamento: gasto.dataPagamento ?? null,
            observacao: gasto.observacao ?? null,
            categoriaId: gasto.categoriaId,
            responsavelId: gasto.responsavelId,
            cartaoCreditoId: gasto.cartaoCreditoId || null,
            faturaCartaoId: gasto.faturaCartaoId || null,
            recorrenciaPaiId: gasto.recorrenciaPaiId || null,
            dataInicioRecorrencia: gasto.dataInicioRecorrencia ?? null,
            dataFimRecorrencia: gasto.dataFimRecorrencia ?? null,
          },
        });

        const gastoFinal = gasto.origemLancamento === "recorrente" && !gasto.recorrenciaPaiId
          ? await transaction.gasto.update({
              where: { id: gastoCriado.id },
              data: {
                recorrenciaPaiId: gastoCriado.id,
                dataInicioRecorrencia: gastoCriado.dataInicioRecorrencia ?? gastoCriado.dataVencimento ?? gastoCriado.competencia,
              },
            })
          : gastoCriado;

        if (gasto.origemLancamento === "parcelado") {
          await refreshLancamentosBase(transaction, gastoFinal);
        }

        return gastoFinal;
      });

      return await this.prisma.gasto.findFirst({ where: { id: criado.id } });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o gasto.");
    }
  }

  async listarGastosPorResponsavelId(responsavelId: string) {
    try {
      const usuariosCompartilhadosIds = await listarUsuariosCompartilhados(this.prisma, responsavelId);
      const gastos = await this.prisma.gasto.findMany({
        where: {
          deletedAt: null,
          OR: [
            { responsavelId },
            ...(usuariosCompartilhadosIds.length > 0
              ? [{ responsavelId: { in: usuariosCompartilhadosIds }, naoCompartilhar: false }]
              : []),
          ],
        },
        include: {
          responsavel: { select: { nome: true } },
          faturaCartao: { select: { competencia: true, status: true } },
          cartaoCredito: {
            include: {
              usuario: {
                select: {
                  nome: true,
                  email: true,
                },
              },
            },
          },
          lancamentosBase: {
            orderBy: { numeroParcela: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return gastos.map((gasto) => ({
        ...gasto,
        valor: Number(gasto.valor),
        responsavelNome: gasto.responsavel.nome,
        faturaCartaoCompetencia: gasto.faturaCartao?.competencia ?? null,
        faturaCartaoStatus: gasto.faturaCartao?.status ?? null,
        cartaoCreditoDescricao: gasto.cartaoCredito?.descricao ?? null,
        cartaoCreditoUsuarioNome: gasto.cartaoCredito?.usuario.nome ?? null,
        cartaoCreditoUsuarioEmail: gasto.cartaoCredito?.usuario.email ?? null,
        lancamentosBase: gasto.lancamentosBase.map((lancamento) => ({
          ...lancamento,
          valorParcela: Number(lancamento.valorParcela),
        })),
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar os gastos.");
    }
  }

  async buscarTotalGastoMesAtualPorResponsavelId(responsavelId: string, inicioMes: Date, fimMes: Date) {
    try {
      const resultado = await this.prisma.gasto.aggregate({
        _sum: { valor: true },
        where: {
          responsavelId,
          deletedAt: null,
          tipo: "despesa",
          status: { not: "cancelado" },
          competencia: { gte: inicioMes, lt: fimMes },
        },
      });

      return Number(resultado._sum.valor ?? 0);
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel calcular o total gasto no mes atual.");
    }
  }

  async listarModelosRecorrentesAtivosPorResponsaveis(responsaveisIds: string[], inicioMes: Date, fimMes: Date) {
    try {
      if (responsaveisIds.length === 0) {
        return [];
      }

      const modelos = await this.prisma.gasto.findMany({
        where: {
          deletedAt: null,
          origemLancamento: "recorrente",
          dataVencimento: { not: null },
          responsavelId: { in: responsaveisIds },
          AND: [
            {
              OR: [
                { dataInicioRecorrencia: null },
                { dataInicioRecorrencia: { lt: fimMes } },
              ],
            },
            {
              OR: [
                { dataFimRecorrencia: null },
                { dataFimRecorrencia: { gte: inicioMes } },
              ],
            },
          ],
        },
      });

      return modelos.filter((modelo) => modelo.recorrenciaPaiId === null || modelo.recorrenciaPaiId === modelo.id);
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar os modelos de gastos recorrentes.");
    }
  }

  async buscarGastoGeradoPorRecorrencia(recorrenciaPaiId: string, inicioMes: Date, fimMes: Date) {
    try {
      return await this.prisma.gasto.findFirst({
        where: {
          recorrenciaPaiId,
          deletedAt: null,
          competencia: { gte: inicioMes, lt: fimMes },
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar o gasto recorrente gerado.");
    }
  }

  async listarGastosDaSerieRecorrente(recorrenciaPaiId: string) {
    try {
      return await this.prisma.gasto.findMany({
        where: {
          deletedAt: null,
          origemLancamento: "recorrente",
          recorrenciaPaiId,
        },
        orderBy: { competencia: "asc" },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar os gastos da serie recorrente.");
    }
  }

  calcularDataVencimentoRecorrente(dataVencimentoOriginal: Date, competencia: Date) {
    const diaVencimento = dataVencimentoOriginal.getDate();
    const ultimoDiaMes = new Date(competencia.getFullYear(), competencia.getMonth() + 1, 0).getDate();

    return new Date(competencia.getFullYear(), competencia.getMonth(), Math.min(diaVencimento, ultimoDiaMes));
  }

  normalizarCompetenciaMes(date: Date) {
    return getStartOfMonth(date);
  }

  async buscarGastoPorId(id: string) {
    try {
      const gasto = await this.prisma.gasto.findFirst({
        where: { id, deletedAt: null },
        include: {
          cartaoCredito: {
            include: {
              usuario: {
                select: { id: true, nome: true, email: true },
              },
            },
          },
          faturaCartao: true,
          lancamentosBase: {
            orderBy: { numeroParcela: "asc" },
          },
        },
      });

      return gasto
        ? {
            ...gasto,
            valor: Number(gasto.valor),
            lancamentosBase: gasto.lancamentosBase.map((lancamento) => ({
              ...lancamento,
              valorParcela: Number(lancamento.valorParcela),
            })),
          }
        : null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar o gasto.");
    }
  }

  async pagarGasto(id: string, dataPagamento: Date) {
    try {
      return await this.prisma.gasto.update({
        where: { id },
        data: {
          dataPagamento,
          status: "pago",
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel pagar o gasto.");
    }
  }

  async reabrirGasto(id: string) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const gastoReaberto = await transaction.gasto.update({
          where: { id },
          data: {
            dataPagamento: null,
            status: "pendente",
          },
        });

        if (gastoReaberto.origemLancamento === "parcelado") {
          await transaction.lancamentoBase.updateMany({
            where: { gastoId: id },
            data: {
              dataPagamentoParcela: null,
              status: "pendente",
            },
          });
        }

        return gastoReaberto;
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel reabrir o gasto.");
    }
  }

  async buscarLancamentoBasePorId(id: string) {
    try {
      const lancamento = await this.prisma.lancamentoBase.findUnique({
        where: { id },
        include: {
          gasto: {
            select: {
              responsavelId: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!lancamento || lancamento.gasto.deletedAt) {
        return null;
      }

      return {
        ...lancamento,
        valorParcela: Number(lancamento.valorParcela),
        responsavelId: lancamento.gasto.responsavelId,
      };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar a parcela.");
    }
  }

  async listarLancamentosBasePorGastoId(gastoId: string) {
    try {
      const lancamentos = await this.prisma.lancamentoBase.findMany({
        where: { gastoId },
        orderBy: { numeroParcela: "asc" },
      });

      return lancamentos.map((lancamento) => ({
        ...lancamento,
        valorParcela: Number(lancamento.valorParcela),
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as parcelas do gasto.");
    }
  }

  async vincularLancamentoBaseAFatura(lancamentoBaseId: string, faturaCartaoId: string) {
    try {
      await this.prisma.lancamentoBase.update({
        where: { id: lancamentoBaseId },
        data: { faturaCartaoId },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel vincular a parcela a fatura do cartao.");
    }
  }

  async pagarLancamentoBase(id: string, dataPagamento: Date) {
    try {
      await this.prisma.lancamentoBase.update({
        where: { id },
        data: {
          dataPagamentoParcela: dataPagamento,
          status: "pago",
        },
      });

      return await this.buscarLancamentoBasePorId(id);
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel pagar a parcela.");
    }
  }

  async atualizarGasto(id: string, data: iAtualizarGasto) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const gastoAtualizado = await transaction.gasto.update({
          where: { id },
          data,
        });

        if (gastoAtualizado.origemLancamento === "parcelado") {
          await refreshLancamentosBase(transaction, gastoAtualizado);
        } else {
          await transaction.lancamentoBase.deleteMany({ where: { gastoId: id } });
        }

        return gastoAtualizado;
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel atualizar o gasto.");
    }
  }

  async deletarGasto(id: string) {
    try {
      return await this.prisma.gasto.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: "cancelado",
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel excluir o gasto.");
    }
  }
}

export const gastoRepository = new PrismaGastoRepository();
