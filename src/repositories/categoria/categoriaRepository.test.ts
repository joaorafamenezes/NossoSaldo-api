export {};

let mockPrisma: any;

jest.mock("@prisma/client", () => {
  mockPrisma = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const { categoriaRepository } = require("./categoriaRepository");

describe("CategoriaRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create category with correct payload", async () => {
    mockPrisma.$executeRaw.mockResolvedValue(1);
    mockPrisma.$queryRaw.mockResolvedValue([
      { id: "cat-1", descricao: "Alimentacao", iconName: "🍔" },
    ]);

    await expect(
      categoriaRepository.criarCategoria({ descricao: "Alimentacao", iconName: "🍔" })
    ).resolves.toEqual({
      id: "cat-1",
      descricao: "Alimentacao",
      iconName: "🍔",
    });
  });

  it("should map repository errors on create to 500", async () => {
    mockPrisma.$executeRaw.mockRejectedValue(new Error("Database unavailable"));

    await expect(
      categoriaRepository.criarCategoria({ descricao: "Alimentacao", iconName: "🍔" })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "Nao foi possivel criar a categoria.",
    });
  });

  it("should map repository errors on list to 500", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("Database unavailable"));

    await expect(categoriaRepository.buscarTodasCategorias()).rejects.toMatchObject({
      statusCode: 500,
      message: "Nao foi possivel listar as categorias.",
    });
  });
});
