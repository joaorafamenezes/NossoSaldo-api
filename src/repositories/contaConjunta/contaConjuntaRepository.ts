import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";

const prisma = new PrismaClient();

class ContaConjuntaRepository {

    async criarContaConjunta(contaConjunta: iCriarContaConjunta) {
        try {
            return await prisma.contaConjunta.create({
                data: contaConjunta,
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
                }
            });
        } catch (error) {
            throw createRepositoryError(error, "Não foi possível listar as contas conjuntas.");
        }
    }
}

export const contaConjuntaRepository = new ContaConjuntaRepository();
