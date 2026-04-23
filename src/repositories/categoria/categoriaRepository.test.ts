import { categoriaRepository } from "./categoriaRepository";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const mockCategoria = {
    create: jest.fn(),
    findMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      categoria: mockCategoria,
    })),
  };
});

describe("CategoriaRepository", () => {
  let mockPrisma: any;

  beforeEach(() => {
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  it("should create category with correct payload", async () => {
    mockPrisma.categoria.create.mockResolvedValue({ id: "cat-1", descricao: "Alimentacao" });

    await expect(categoriaRepository.criarCategoria({ descricao: "Alimentacao" })).resolves.toEqual({
      id: "cat-1",
      descricao: "Alimentacao",
    });
  });

  it("should map repository errors on create to 500", async () => {
    mockPrisma.categoria.create.mockRejectedValue(new Error("Database unavailable"));

    await expect(categoriaRepository.criarCategoria({ descricao: "Alimentacao" })).rejects.toMatchObject({
      statusCode: 500,
      message: "Não foi possível criar a categoria.",
    });
  });

  it("should map repository errors on list to 500", async () => {
    mockPrisma.categoria.findMany.mockRejectedValue(new Error("Database unavailable"));

    await expect(categoriaRepository.buscarTodasCategorias()).rejects.toMatchObject({
      statusCode: 500,
      message: "Não foi possível listar as categorias.",
    });
  });
});
