import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { createRepositoryError } from "../../errors/httpError";

const prisma = new PrismaClient();

type CriarCategoriaInput = {
  descricao: string;
  iconName: string;
};

type CategoriaRow = {
  id: string;
  descricao: string;
  iconName: string;
  createdAt: Date;
  updatedAt: Date;
};

class CategoriaRepository {
  async criarCategoria(categoria: CriarCategoriaInput) {
    try {
      const id = randomUUID();

      await prisma.$executeRaw`
        INSERT INTO Categoria (id, descricao, iconName, createdAt, updatedAt)
        VALUES (${id}, ${categoria.descricao}, ${categoria.iconName}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `;

      const [categoriaCriada] = await prisma.$queryRaw<CategoriaRow[]>`
        SELECT id, descricao, iconName, createdAt, updatedAt
        FROM Categoria
        WHERE id = ${id}
      `;

      return categoriaCriada;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar a categoria.");
    }
  }

  async buscarTodasCategorias() {
    try {
      return await prisma.$queryRaw<CategoriaRow[]>`
        SELECT id, descricao, iconName, createdAt, updatedAt
        FROM Categoria
        ORDER BY createdAt DESC
      `;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as categorias.");
    }
  }
}

export const categoriaRepository = new CategoriaRepository();
