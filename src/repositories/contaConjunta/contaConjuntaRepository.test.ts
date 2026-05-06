import { contaConjuntaRepository } from "./contaConjuntaRepository";

jest.mock("@prisma/client", () => {
  const mockContaConjunta = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  };
  const mockExecuteRaw = jest.fn();
  const mockQueryRaw = jest.fn();

  return {
    PrismaClient: jest.fn(() => ({
      contaConjunta: mockContaConjunta,
      $executeRaw: mockExecuteRaw,
      $queryRaw: mockQueryRaw,
    })),
  };
});

describe("ContaConjuntaRepository", () => {
  let mockPrisma: any;

  beforeEach(() => {
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  it("should create conta conjunta successfully", async () => {
    const payload = {
      nomeConta: "Casa",
      usuario1Id: "user-1",
      usuario2Id: "user-2",
    };
    mockPrisma.contaConjunta.create.mockResolvedValue({ id: "conta-1", ...payload });

    await expect(contaConjuntaRepository.criarContaConjunta(payload.nomeConta, payload.usuario1Id, payload.usuario2Id)).resolves.toEqual({
      id: "conta-1",
      ...payload,
    });
  });

  it("should map create conta conjunta errors to 500", async () => {
    mockPrisma.contaConjunta.create.mockRejectedValue(new Error("Database unavailable"));

    await expect(
      contaConjuntaRepository.criarContaConjunta("Casa", "user-1", "user-2"),
    ).rejects.toHaveProperty("message", "Nao foi possivel criar a conta conjunta.");
  });

  it("should find conta conjunta by pair of user ids", async () => {
    const conta = { id: "conta-1", usuario1Id: "user-1", usuario2Id: "user-2" };
    mockPrisma.contaConjunta.findFirst.mockResolvedValue(conta);

    await expect(contaConjuntaRepository.listarContaConjuntaPorIds("user-1", "user-2")).resolves.toEqual(conta);
    expect(mockPrisma.contaConjunta.findFirst).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          {
            usuario1Id: "user-1",
            usuario2Id: "user-2",
          },
          {
            usuario1Id: "user-2",
            usuario2Id: "user-1",
          },
        ],
      },
    });
  });

  it("should map list conta conjunta by ids errors to 500", async () => {
    mockPrisma.contaConjunta.findFirst.mockRejectedValue(new Error("Database unavailable"));

    await expect(contaConjuntaRepository.listarContaConjuntaPorIds("user-1", "user-2")).rejects.toHaveProperty(
      "message",
      "Nao foi possivel listar a conta conjunta.",
    );
  });

  it("should list contas conjuntas by user id", async () => {
    const contas = [{ id: "conta-1" }, { id: "conta-2" }];
    mockPrisma.contaConjunta.findMany.mockResolvedValue(contas);

    await expect(contaConjuntaRepository.listarContasConjuntasPorUsuarioId("user-1")).resolves.toEqual(contas);
    expect(mockPrisma.contaConjunta.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { usuario1Id: "user-1" },
          { usuario2Id: "user-1" },
        ],
      },
      include: {
        usuario1: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuario2: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  });

  it("should map list contas conjuntas by user id errors to 500", async () => {
    mockPrisma.contaConjunta.findMany.mockRejectedValue(new Error("Database unavailable"));

    await expect(contaConjuntaRepository.listarContasConjuntasPorUsuarioId("user-1")).rejects.toHaveProperty(
      "message",
      "Nao foi possivel listar as contas conjuntas.",
    );
  });

  it("should find conta conjunta by id", async () => {
    const conta = { id: "conta-1", usuario1Id: "user-1", usuario2Id: "user-2" };
    mockPrisma.contaConjunta.findFirst.mockResolvedValue(conta);

    await expect(contaConjuntaRepository.buscarContaConjuntaPorId("conta-1")).resolves.toEqual(conta);
    expect(mockPrisma.contaConjunta.findFirst).toHaveBeenCalledWith({
      where: {
        id: "conta-1",
        deletedAt: null,
      },
      include: {
        usuario1: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuario2: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  });

  it("should soft delete conta conjunta successfully", async () => {
    const deletedAt = new Date("2026-05-05T12:00:00.000Z");
    mockPrisma.$executeRaw.mockResolvedValue(1);
    mockPrisma.$queryRaw.mockResolvedValue([{ id: "conta-1", deletedAt }]);

    await expect(contaConjuntaRepository.desvincularContaConjunta("conta-1")).resolves.toEqual({
      id: "conta-1",
      deletedAt,
    });
  });
});
