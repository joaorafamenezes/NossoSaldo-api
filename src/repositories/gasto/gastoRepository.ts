import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { createRepositoryError } from "../../errors/httpError";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";

const prisma = new PrismaClient();

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
        const cents = index === installments - 1
            ? baseInstallmentCents + remainderCents
            : baseInstallmentCents;

        return cents / 100;
    });
}

function getStartOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function refreshLancamentosBase(transaction: any, gasto: any) {
    const numeroParcelas = gasto.numeroParcelas ?? 1;
    const dataVencimento = gasto.dataVencimento ? new Date(gasto.dataVencimento) : null;

    if (!dataVencimento || Number.isNaN(dataVencimento.getTime())) {
        throw new Error("Data de vencimento obrigatoria para lancamentos parcelados.");
    }

    const currentPaymentDates: Array<{
        numeroParcela: number;
        dataPagamentoParcela: Date | null;
    }> = await transaction.$queryRaw`
        SELECT numeroParcela, dataPagamentoParcela
        FROM LancamentoBase
        WHERE gastoId = ${gasto.id}
    `;
    const paymentDatesByInstallment = new Map(
        currentPaymentDates.map((item) => [item.numeroParcela, item.dataPagamentoParcela]),
    );
    const installmentValues = calculateInstallmentValues(Number(gasto.valor), numeroParcelas);

    await transaction.$executeRaw`
        DELETE FROM LancamentoBase
        WHERE gastoId = ${gasto.id}
    `;

    for (let index = 0; index < numeroParcelas; index += 1) {
        const numeroParcela = index + 1;
        const dataParcela = addMonthsKeepingDay(dataVencimento, index);

        await transaction.$executeRaw`
            INSERT INTO LancamentoBase (
                id,
                gastoId,
                descricao,
                valorParcela,
                numeroParcela,
                dataVencimentoParcela,
                dataPagamentoParcela,
                status,
                competencia,
                observacao,
                createdAt,
                updatedAt
            )
            VALUES (
                ${randomUUID()},
                ${gasto.id},
                ${`${gasto.descricao} - parcela ${numeroParcela}/${numeroParcelas}`},
                ${installmentValues[index]},
                ${numeroParcela},
                ${dataParcela},
                ${paymentDatesByInstallment.get(numeroParcela) ?? gasto.dataPagamento ?? null},
                ${gasto.status},
                ${dataParcela},
                ${gasto.observacao ?? null},
                CURRENT_TIMESTAMP(3),
                CURRENT_TIMESTAMP(3)
            )
        `;
    }
}

class GastoRepository {
    async criarGastoUsuarioLogado(gasto: iCriarGasto) {
        try {
            const id = randomUUID();

            await prisma.$transaction(async (transaction) => {
                await transaction.$executeRaw`
                    INSERT INTO Gasto (
                        id,
                        descricao,
                        tipo,
                        status,
                        origemLancamento,
                        numeroParcelas,
                        naoCompartilhar,
                        valor,
                        competencia,
                        dataVencimento,
                        dataPagamento,
                        observacao,
                        categoriaId,
                        responsavelId,
                        cartaoCreditoId,
                        faturaCartaoId,
                        recorrenciaPaiId,
                        dataInicioRecorrencia,
                        dataFimRecorrencia,
                        createdAt,
                        updatedAt
                    )
                    VALUES (
                        ${id},
                        ${gasto.descricao},
                        ${gasto.tipo},
                        ${gasto.status},
                        ${gasto.origemLancamento},
                        ${gasto.numeroParcelas ?? 1},
                        ${gasto.naoCompartilhar ?? false},
                        ${gasto.valor},
                        ${gasto.competencia ?? null},
                        ${gasto.dataVencimento ?? null},
                        ${gasto.dataPagamento ?? null},
                        ${gasto.observacao ?? null},
                        ${gasto.categoriaId},
                        ${gasto.responsavelId},
                        ${gasto.cartaoCreditoId || null},
                        ${gasto.faturaCartaoId || null},
                        ${gasto.recorrenciaPaiId || null},
                        ${gasto.dataInicioRecorrencia ?? null},
                        ${gasto.dataFimRecorrencia ?? null},
                        CURRENT_TIMESTAMP(3),
                        CURRENT_TIMESTAMP(3)
                    )
                `;

                if (gasto.origemLancamento === "recorrente" && !gasto.recorrenciaPaiId) {
                    await transaction.$executeRaw`
                        UPDATE Gasto
                        SET
                            recorrenciaPaiId = ${id},
                            dataInicioRecorrencia = COALESCE(dataInicioRecorrencia, dataVencimento, competencia),
                            updatedAt = CURRENT_TIMESTAMP(3)
                        WHERE id = ${id}
                    `;
                }

                if (gasto.origemLancamento !== "parcelado") {
                    return;
                }

                await refreshLancamentosBase(transaction, { ...gasto, id });
            });

            return await prisma.gasto.findFirst({
                where: { id },
            });
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel criar o gasto.");
        }
    }

    async listarGastosPorResponsavelId(responsavelId: string) {
        try {
            const contasConjuntas = await prisma.contaConjunta.findMany({
                where: {
                    OR: [
                        { usuario1Id: responsavelId },
                        { usuario2Id: responsavelId },
                    ],
                },
                select: {
                    usuario1Id: true,
                    usuario2Id: true,
                },
            });
            const usuariosCompartilhadosIds = Array.from(new Set(
                contasConjuntas.map((conta) => (
                    conta.usuario1Id === responsavelId
                        ? conta.usuario2Id
                        : conta.usuario1Id
                )),
            ));

            const sharedExpensesCondition = usuariosCompartilhadosIds.length > 0
                ? Prisma.sql`OR (gasto.responsavelId IN (${Prisma.join(usuariosCompartilhadosIds)}) AND gasto.naoCompartilhar = false)`
                : Prisma.empty;

            const gastos = await prisma.$queryRaw<Array<any>>`
                SELECT
                    gasto.id,
                    gasto.descricao,
                    gasto.tipo,
                    gasto.status,
                    gasto.origemLancamento,
                    gasto.numeroParcelas,
                    gasto.naoCompartilhar,
                    gasto.valor,
                    gasto.competencia,
                    gasto.dataVencimento,
                    gasto.dataPagamento,
                    gasto.observacao,
                    gasto.categoriaId,
                    gasto.responsavelId,
                    usuario.nome AS responsavelNome,
                    gasto.cartaoCreditoId,
                    gasto.faturaCartaoId,
                    gasto.recorrenciaPaiId,
                    gasto.dataInicioRecorrencia,
                    gasto.dataFimRecorrencia,
                    fatura.competencia AS faturaCartaoCompetencia,
                    fatura.status AS faturaCartaoStatus,
                    cartao.descricao AS cartaoCreditoDescricao,
                    cartaoUsuario.nome AS cartaoCreditoUsuarioNome,
                    cartaoUsuario.email AS cartaoCreditoUsuarioEmail,
                    gasto.deletedAt,
                    gasto.createdAt,
                    gasto.updatedAt
                FROM Gasto gasto
                INNER JOIN Usuario usuario ON usuario.id = gasto.responsavelId
                LEFT JOIN CartaoCredito cartao ON cartao.id = gasto.cartaoCreditoId
                LEFT JOIN FaturaCartao fatura ON fatura.id = gasto.faturaCartaoId
                LEFT JOIN Usuario cartaoUsuario ON cartaoUsuario.id = cartao.usuarioId
                WHERE gasto.deletedAt IS NULL
                  AND (
                    gasto.responsavelId = ${responsavelId}
                    ${sharedExpensesCondition}
                  )
                ORDER BY gasto.createdAt DESC
            `;

            if (gastos.length === 0) {
                return [];
            }

            const gastosIds = gastos.map((gasto) => gasto.id);
            const lancamentosBase = await prisma.$queryRaw<Array<any>>`
                SELECT
                    id,
                    gastoId,
                    descricao,
                    valorParcela,
                    numeroParcela,
                    dataVencimentoParcela,
                    dataPagamentoParcela,
                    status,
                    competencia,
                    faturaCartaoId,
                    observacao,
                    createdAt,
                    updatedAt
                FROM LancamentoBase
                WHERE gastoId IN (${Prisma.join(gastosIds)})
                ORDER BY numeroParcela ASC
            `;

            const lancamentosPorGastoId = new Map<string, Array<any>>();

            for (const lancamento of lancamentosBase) {
                const registros = lancamentosPorGastoId.get(lancamento.gastoId) ?? [];
                registros.push(lancamento);
                lancamentosPorGastoId.set(lancamento.gastoId, registros);
            }

            return gastos.map((gasto) => ({
                ...gasto,
                lancamentosBase: lancamentosPorGastoId.get(gasto.id) ?? [],
            }));
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel listar os gastos.");
        }
    }

    async buscarTotalGastoMesAtualPorResponsavelId(responsavelId: string, inicioMes: Date, fimMes: Date) {
        try {
            const resultado = await prisma.gasto.aggregate({
                _sum: {
                    valor: true,
                },
                where: {
                    responsavelId,
                    deletedAt: null,
                    tipo: "despesa",
                    status: {
                        not: "cancelado",
                    },
                    competencia: {
                        gte: inicioMes,
                        lt: fimMes,
                    },
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

            return await prisma.$queryRaw<Array<any>>`
                SELECT
                    gasto.id,
                    gasto.descricao,
                    gasto.tipo,
                    gasto.valor,
                    gasto.categoriaId,
                    gasto.responsavelId,
                    gasto.cartaoCreditoId,
                    gasto.naoCompartilhar,
                    gasto.dataVencimento,
                    gasto.observacao,
                    gasto.dataInicioRecorrencia,
                    gasto.dataFimRecorrencia
                FROM Gasto gasto
                WHERE gasto.deletedAt IS NULL
                  AND gasto.origemLancamento = 'recorrente'
                  AND (
                    gasto.recorrenciaPaiId IS NULL
                    OR gasto.recorrenciaPaiId = gasto.id
                  )
                  AND gasto.dataVencimento IS NOT NULL
                  AND gasto.responsavelId IN (${Prisma.join(responsaveisIds)})
                  AND COALESCE(gasto.dataInicioRecorrencia, gasto.dataVencimento) < ${fimMes}
                  AND gasto.dataFimRecorrencia IS NULL
            `;
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel listar os modelos de gastos recorrentes.");
        }
    }

    async buscarGastoGeradoPorRecorrencia(recorrenciaPaiId: string, inicioMes: Date, fimMes: Date) {
        try {
            return await prisma.gasto.findFirst({
                where: {
                    recorrenciaPaiId,
                    deletedAt: null,
                    competencia: {
                        gte: inicioMes,
                        lt: fimMes,
                    },
                },
            });
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel buscar o gasto recorrente gerado.");
        }
    }

    async listarGastosDaSerieRecorrente(recorrenciaPaiId: string) {
        try {
            return await prisma.gasto.findMany({
                where: {
                    deletedAt: null,
                    origemLancamento: "recorrente",
                    recorrenciaPaiId,
                },
                orderBy: {
                    competencia: "asc",
                },
            });
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel listar os gastos da serie recorrente.");
        }
    }

    calcularDataVencimentoRecorrente(dataVencimentoOriginal: Date, competencia: Date) {
        const diaVencimento = dataVencimentoOriginal.getDate();
        const ultimoDiaMes = new Date(competencia.getFullYear(), competencia.getMonth() + 1, 0).getDate();

        return new Date(
            competencia.getFullYear(),
            competencia.getMonth(),
            Math.min(diaVencimento, ultimoDiaMes),
        );
    }

    normalizarCompetenciaMes(date: Date) {
        return getStartOfMonth(date);
    }

    async buscarGastoPorId(id: string) {
        try {
            return await prisma.gasto.findFirst({
                where: {
                    id,
                    deletedAt: null,
                },
                include: {
                    cartaoCredito: {
                        include: {
                            usuario: {
                                select: {
                                    id: true,
                                    nome: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    faturaCartao: true,
                    lancamentosBase: {
                        orderBy: { numeroParcela: "asc" },
                    },
                },
            });
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel buscar o gasto.");
        }
    }

    async pagarGasto(id: string, dataPagamento: Date) {
        try {
            return await prisma.gasto.update({
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
            return await prisma.$transaction(async (transaction) => {
                const gastoReaberto = await transaction.gasto.update({
                    where: { id },
                    data: {
                        dataPagamento: null,
                        status: "pendente",
                    },
                });

                if ((gastoReaberto as any).origemLancamento === "parcelado") {
                    await transaction.$executeRaw`
                        UPDATE LancamentoBase
                        SET
                            dataPagamentoParcela = NULL,
                            status = 'pendente',
                            updatedAt = CURRENT_TIMESTAMP(3)
                        WHERE gastoId = ${id}
                    `;
                }

                return gastoReaberto;
            });
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel reabrir o gasto.");
        }
    }

    async buscarLancamentoBasePorId(id: string) {
        try {
            const lancamentos = await prisma.$queryRaw<Array<{
                id: string;
                gastoId: string;
                descricao: string;
                valorParcela: number;
                numeroParcela: number;
                dataVencimentoParcela: Date;
                dataPagamentoParcela: Date | null;
                status: string;
                competencia: Date;
                observacao: string | null;
                responsavelId: string;
            }>>`
                SELECT
                    lancamento.id,
                    lancamento.gastoId,
                    lancamento.descricao,
                    lancamento.valorParcela,
                    lancamento.numeroParcela,
                    lancamento.dataVencimentoParcela,
                    lancamento.dataPagamentoParcela,
                    lancamento.status,
                    lancamento.competencia,
                    lancamento.observacao,
                    gasto.responsavelId
                FROM LancamentoBase lancamento
                INNER JOIN Gasto gasto ON gasto.id = lancamento.gastoId
                WHERE lancamento.id = ${id}
                  AND gasto.deletedAt IS NULL
                LIMIT 1
            `;

            return lancamentos[0] ?? null;
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel buscar a parcela.");
        }
    }

    async listarLancamentosBasePorGastoId(gastoId: string) {
        try {
            return await prisma.$queryRaw<Array<{
                id: string;
                gastoId: string;
                valorParcela: number;
                numeroParcela: number;
                dataVencimentoParcela: Date;
                faturaCartaoId: string | null;
            }>>`
                SELECT
                    id,
                    gastoId,
                    valorParcela,
                    numeroParcela,
                    dataVencimentoParcela,
                    faturaCartaoId
                FROM LancamentoBase
                WHERE gastoId = ${gastoId}
                ORDER BY numeroParcela ASC
            `;
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel listar as parcelas do gasto.");
        }
    }

    async vincularLancamentoBaseAFatura(lancamentoBaseId: string, faturaCartaoId: string) {
        try {
            await prisma.$executeRaw`
                UPDATE LancamentoBase
                SET
                    faturaCartaoId = ${faturaCartaoId},
                    updatedAt = CURRENT_TIMESTAMP(3)
                WHERE id = ${lancamentoBaseId}
            `;
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel vincular a parcela a fatura do cartao.");
        }
    }

    async pagarLancamentoBase(id: string, dataPagamento: Date) {
        try {
            await prisma.$executeRaw`
                UPDATE LancamentoBase
                SET
                    dataPagamentoParcela = ${dataPagamento},
                    status = 'pago',
                    updatedAt = CURRENT_TIMESTAMP(3)
                WHERE id = ${id}
            `;

            return await this.buscarLancamentoBasePorId(id);
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel pagar a parcela.");
        }
    }

    async atualizarGasto(id: string, data: iAtualizarGasto) {
        try {
            return await prisma.$transaction(async (transaction) => {
                const gastoAtualizado = await transaction.gasto.update({
                    where: { id },
                    data,
                });

                const normalizedGasto = gastoAtualizado as any;

                if (normalizedGasto.origemLancamento === "parcelado") {
                    await refreshLancamentosBase(transaction, normalizedGasto);
                } else {
                    await transaction.$executeRaw`
                        DELETE FROM LancamentoBase
                        WHERE gastoId = ${id}
                    `;
                }

                return gastoAtualizado;
            });
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel atualizar o gasto.");
        }
    }

    async deletarGasto(id: string) {
        try {
            return await prisma.gasto.update({
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

export const gastoRepository = new GastoRepository();
