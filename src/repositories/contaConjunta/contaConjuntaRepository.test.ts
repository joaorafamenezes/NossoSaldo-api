import { contaConjuntaRepository } from "./contaConjuntaRepository";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const mockContaConjunta = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      contaConjunta: mockContaConjunta,
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

    await expect(contaConjuntaRepository.criarContaConjunta(payload)).resolves.toEqual({
      id: "conta-1",
      ...payload,
    });
  });

  it("should map create conta conjunta errors to 500", async () => {
    mockPrisma.contaConjunta.create.mockRejectedValue(new Error("Database unavailable"));

    await expect(
      contaConjuntaRepository.criarContaConjunta({
        nomeConta: "Casa",
        usuario1Id: "user-1",
        usuario2Id: "user-2",
      }),
    ).rejects.toHaveProperty("message", "Não foi possível criar a conta conjunta.");
  });

  it("should find conta conjunta by pair of user ids", async () => {
    const conta = { id: "conta-1", usuario1Id: "user-1", usuario2Id: "user-2" };
    mockPrisma.contaConjunta.findFirst.mockResolvedValue(conta);

    await expect(contaConjuntaRepository.listarContaConjuntaPorIds("user-1", "user-2")).resolves.toEqual(conta);
  });

  it("should map list conta conjunta by ids errors to 500", async () => {
    mockPrisma.contaConjunta.findFirst.mockRejectedValue(new Error("Database unavailable"));

    await expect(contaConjuntaRepository.listarContaConjuntaPorIds("user-1", "user-2")).rejects.toHaveProperty(
      "message",
      "Não foi possível listar a conta conjunta.",
    );
  });

  it("should list contas conjuntas by user id", async () => {
    const contas = [{ id: "conta-1" }, { id: "conta-2" }];
    mockPrisma.contaConjunta.findMany.mockResolvedValue(contas);

    await expect(contaConjuntaRepository.listarContasConjuntasPorUsuarioId("user-1")).resolves.toEqual(contas);
  });

  it("should map list contas conjuntas by user id errors to 500", async () => {
    mockPrisma.contaConjunta.findMany.mockRejectedValue(new Error("Database unavailable"));

    await expect(contaConjuntaRepository.listarContasConjuntasPorUsuarioId("user-1")).rejects.toHaveProperty(
      "message",
      "Não foi possível listar as contas conjuntas.",
    );
  });
});
