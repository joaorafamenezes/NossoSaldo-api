import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { createRepositoryError } from "../../errors/httpError";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";

const prisma = new PrismaClient();

class GastoRepository {
    async criarGastoUsuarioLogado(gasto: iCriarGasto) {
        try {
            const id = randomUUID();

            await prisma.$executeRaw`
                INSERT INTO Gasto (
                    id,
                    descricao,
                    tipo,
                    status,
                    origemLancamento,
                    numeroParcelas,
                    valor,
                    competencia,
                    dataVencimento,
                    dataPagamento,
                    observacao,
                    categoriaId,
                    responsavelId,
                    contaConjuntaId,
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
                    ${gasto.valor},
                    ${gasto.competencia ?? null},
                    ${gasto.dataVencimento ?? null},
                    ${gasto.dataPagamento ?? null},
                    ${gasto.observacao ?? null},
                    ${gasto.categoriaId},
                    ${gasto.responsavelId},
                    ${gasto.contaConjuntaId ?? null},
                    CURRENT_TIMESTAMP(3),
                    CURRENT_TIMESTAMP(3)
                )
            `;

            return await prisma.gasto.findFirst({
                where: { id },
            });
        } catch (error) {
            throw createRepositoryError(error, "Nao foi possivel criar o gasto.");
        }
    }

    async listarGastosPorResponsavelId(responsavelId: string) {
        try {
            return await prisma.gasto.findMany({
                where: {
                    responsavelId,
                    deletedAt: null,
                },
                orderBy: { createdAt: "desc" },
            });
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

    async buscarGastoPorId(id: string) {
        try {
            return await prisma.gasto.findFirst({
                where: {
                    id,
                    deletedAt: null,
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

    async atualizarGasto(id: string, data: iAtualizarGasto) {
        try {
            return await prisma.gasto.update({
                where: { id },
                data,
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
