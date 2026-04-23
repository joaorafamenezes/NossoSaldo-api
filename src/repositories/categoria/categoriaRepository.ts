import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";

const prisma = new PrismaClient();

type CriarCategoriaInput = {
  descricao: string;
};

class CategoriaRepository {
  async criarCategoria(categoria: CriarCategoriaInput) {
    try {
      return await prisma.categoria.create({
        data: categoria,
      });
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível criar a categoria.");
    }
  }

  async buscarTodasCategorias() {
    try {
      return await prisma.categoria.findMany();
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível listar as categorias.");
    }
  }
}

export const categoriaRepository = new CategoriaRepository();
