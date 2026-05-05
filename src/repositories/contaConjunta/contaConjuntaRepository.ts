import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";

const prisma = new PrismaClient();

class ContaConjuntaRepository {

    async criarContaConjunta(nomeConta: string, usuarioConjuntoValidado: string, usuarioLogadoValidado: string) {
        try {
            return await prisma.contaConjunta.create({
                data: {
                    nomeConta,
                    usuario1Id: usuarioConjuntoValidado,
                    usuario2Id: usuarioLogadoValidado
                }
            });
        } catch (error) {
            throw createRepositoryError(error, "Não foi possível criar a conta conjunta.");
        }
    }

    async listarContaConjuntaPorIds(usuario1Id: string, usuario2Id: string) {
        try {
            return await prisma.contaConjunta.findFirst({
                where: {
                    OR: [
                        {
                            usuario1Id: usuario1Id,
                            usuario2Id: usuario2Id
                        },
                        {
                            usuario1Id: usuario2Id,
                            usuario2Id: usuario1Id
                        }
                    ]
                }
            });
        } catch (error) {
            throw createRepositoryError(error, "Não foi possível listar a conta conjunta.");
        }
    }

    async listarContasConjuntasPorUsuarioId(usuarioId: string) {
        try {
            return await prisma.contaConjunta.findMany({
                where: {
                    OR: [
                        { usuario1Id: usuarioId },
                        { usuario2Id: usuarioId }
                    ]
                },
                include: {
                    usuario1: {
                        select: {
                            id: true,
                            nome: true,
                            email: true
                        }
                    },
                    usuario2: {
                        select: {
                            id: true,
                            nome: true,
                            email: true
                        }
                    }
                }
            });
        } catch (error) {
            throw createRepositoryError(error, "Não foi possível listar as contas conjuntas.");
        }
    }
}

export const contaConjuntaRepository = new ContaConjuntaRepository();
