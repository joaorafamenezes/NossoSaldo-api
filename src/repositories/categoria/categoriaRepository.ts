import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import { CategoriaRepositoryPort } from "../../ports/outbound/categoriaRepositoryPort";
import iCriarCategoria from "../../@types/categoria/iCriarCategoria";

export class PrismaCategoriaRepository implements CategoriaRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async criarCategoria(categoria: iCriarCategoria) {
    try {
      const created = await this.prisma.categoria.create({
        data: {
          descricao: categoria.descricao,
          iconName: categoria.iconName || "🏷️",
          ...(categoria.cor ? { cor: categoria.cor } : {}),
          ...(categoria.teto !== undefined && categoria.teto !== null ? { teto: categoria.teto } : {}),
        },
      });

      return {
        ...created,
        teto: created.teto ? Number(created.teto) : null,
      };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar a categoria.");
    }
  }

  async buscarTodasCategorias() {
    try {
      const categorias = await this.prisma.categoria.findMany({
        orderBy: { createdAt: "desc" },
      });

      return categorias.map((c) => ({
        ...c,
        teto: c.teto ? Number(c.teto) : null,
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as categorias.");
    }
  }

  async atualizarCategoria(id: string, categoria: Partial<iCriarCategoria>) {
    try {
      const updated = await this.prisma.categoria.update({
        where: { id },
        data: {
          ...(categoria.descricao ? { descricao: categoria.descricao } : {}),
          ...(categoria.iconName ? { iconName: categoria.iconName } : {}),
          ...(categoria.cor ? { cor: categoria.cor } : {}),
          ...(categoria.teto !== undefined ? { teto: categoria.teto !== null ? categoria.teto : null } : {}),
        },
      });

      return {
        ...updated,
        teto: updated.teto ? Number(updated.teto) : null,
      };
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel atualizar a categoria.");
    }
  }

  async deletarCategoria(id: string) {
    try {
      return await this.prisma.categoria.delete({
        where: { id },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel excluir a categoria.");
    }
  }
}

export const categoriaRepository = new PrismaCategoriaRepository();
