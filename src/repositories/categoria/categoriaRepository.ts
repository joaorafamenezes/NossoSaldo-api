import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { CategoriaRepositoryPort } from "../../ports/outbound/categoriaRepositoryPort";

export class PrismaCategoriaRepository implements CategoriaRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async criarCategoria(categoria: { descricao: string; iconName: string }) {
    try {
      return await this.prisma.categoria.create({
        data: {
          descricao: categoria.descricao,
          iconName: categoria.iconName,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar a categoria.");
    }
  }

  async buscarTodasCategorias() {
    try {
      return await this.prisma.categoria.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as categorias.");
    }
  }
}

export const categoriaRepository = new PrismaCategoriaRepository();
