import { usuarioRepository } from "./usuarioRepository";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const mockUsuario = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      usuario: mockUsuario,
    })),
  };
});

describe("UsuarioRepository", () => {
  let mockPrisma: any;

  beforeEach(() => {
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  it("should find a user by email", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue({ id: "1", email: "joao@example.com" });

    await expect(usuarioRepository.buscarUsuarioPorEmail("joao@example.com")).resolves.toEqual({
      id: "1",
      email: "joao@example.com",
    });
  });

  it("should map unique constraint errors during creation to 409", async () => {
    mockPrisma.usuario.create.mockRejectedValue({ code: "P2002" });

    await expect(
      usuarioRepository.criarUsuario({
        nome: "Joao",
        email: "joao@example.com",
        senha: "123456",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Registro já existe.",
    });
  });

  it("should map generic database errors to 500 when listing users", async () => {
    mockPrisma.usuario.findMany.mockRejectedValue(new Error("Database unavailable"));

    await expect(usuarioRepository.listarUsuarios()).rejects.toMatchObject({
      statusCode: 500,
      message: "Não foi possível listar os usuários.",
    });
  });

  it("should map generic database errors to 500 when fetching by id", async () => {
    mockPrisma.usuario.findUnique.mockRejectedValue(new Error("Database unavailable"));

    await expect(usuarioRepository.listarUsuarioPorId("1")).rejects.toMatchObject({
      statusCode: 500,
      message: "Não foi possível buscar o usuário.",
    });
  });
});
