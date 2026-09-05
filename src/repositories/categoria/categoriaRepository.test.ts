export {};

let mockPrisma: any;

jest.mock("@prisma/client", () => {
  mockPrisma = {
    categoria: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
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
    mockPrisma.categoria.create.mockResolvedValue({ id: "cat-1", descricao: "Alimentacao", iconName: "🍔", teto: null });

    await expect(
      categoriaRepository.criarCategoria({ descricao: "Alimentacao", iconName: "🍔" })
    ).resolves.toEqual({
      id: "cat-1",
      descricao: "Alimentacao",
      iconName: "🍔",
      teto: null,
    });
  });

  it("should map repository errors on create to 500", async () => {
    mockPrisma.categoria.create.mockRejectedValue(new Error("Database unavailable"));

    await expect(
      categoriaRepository.criarCategoria({ descricao: "Alimentacao", iconName: "🍔" })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "Nao foi possivel criar a categoria.",
    });
  });

  it("should map repository errors on list to 500", async () => {
    mockPrisma.categoria.findMany.mockRejectedValue(new Error("Database unavailable"));

    await expect(categoriaRepository.buscarTodasCategorias()).rejects.toMatchObject({
      statusCode: 500,
      message: "Nao foi possivel listar as categorias.",
    });
  });
});
