import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";

const prisma = new PrismaClient();

class GastoRepository {
    async criarGastoUsuarioLogado(gasto: iCriarGasto) {
        try {
            return await prisma.gasto.create({
                data: gasto,
            });
        } catch (error) {
            throw createRepositoryError(error, "NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi possÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel criar o gasto.");
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
            throw createRepositoryError(error, "NÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£o foi possÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­vel listar os gastos.");
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
            throw createRepositoryError(error, "NÃ£o foi possÃ­vel calcular o total gasto no mÃªs atual.");
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
            throw createRepositoryError(error, "NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi possÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel buscar o gasto.");
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
            throw createRepositoryError(error, "NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£o foi possÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­vel pagar o gasto.");
        }
    }

    async atualizarGasto(id: string, data: iAtualizarGasto) {
        try {
            return await prisma.gasto.update({
                where: { id },
                data,
            });
        } catch (error) {
            throw createRepositoryError(error, "NÃ£o foi possÃ­vel atualizar o gasto.");
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
            throw createRepositoryError(error, "NÃƒÆ’Ã‚Â£o foi possÃƒÆ’Ã‚Â­vel excluir o gasto.");
        }
    }
}

export const gastoRepository = new GastoRepository();
