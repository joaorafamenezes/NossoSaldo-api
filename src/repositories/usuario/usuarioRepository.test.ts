import { usuarioRepository } from "./usuarioRepository";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const mockUsuario = {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
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

  it("should create user successfully", async () => {
    const payload = {
      nome: "Joao",
      email: "joao@example.com",
      senha: "123456",
    };
    mockPrisma.usuario.create.mockResolvedValue({ id: "1", ...payload });

    await expect(usuarioRepository.criarUsuario(payload)).resolves.toEqual({
      id: "1",
      ...payload,
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
    ).rejects.toHaveProperty("message", "Registro já existe.");
  });

  it("should list users successfully", async () => {
    const usuarios = [{ id: "1", nome: "Joao", email: "joao@example.com" }];
    mockPrisma.usuario.findMany.mockResolvedValue(usuarios);

    await expect(usuarioRepository.listarUsuarios()).resolves.toEqual(usuarios);
  });

  it("should map generic database errors to 500 when listing users", async () => {
    mockPrisma.usuario.findMany.mockRejectedValue(new Error("Database unavailable"));

    await expect(usuarioRepository.listarUsuarios()).rejects.toHaveProperty(
      "message",
      "Não foi possível listar os usuários.",
    );
  });

  it("should find user by id successfully", async () => {
    const usuario = { id: "1", nome: "Joao", email: "joao@example.com" };
    mockPrisma.usuario.findUnique.mockResolvedValue(usuario);

    await expect(usuarioRepository.listarUsuarioPorId("1")).resolves.toEqual(usuario);
  });

  it("should map generic database errors to 500 when fetching by id", async () => {
    mockPrisma.usuario.findUnique.mockRejectedValue(new Error("Database unavailable"));

    await expect(usuarioRepository.listarUsuarioPorId("1")).rejects.toHaveProperty(
      "message",
      "Não foi possível buscar o usuário.",
    );
  });

  it("should update user successfully", async () => {
    const usuarioAtualizado = { id: "1", nome: "Joao Atualizado", email: "joao@example.com" };
    mockPrisma.usuario.update.mockResolvedValue(usuarioAtualizado);

    await expect(usuarioRepository.atualizaUsuario("1", { nome: "Joao Atualizado" })).resolves.toEqual(usuarioAtualizado);
  });

  it("should map update user errors to 500", async () => {
    mockPrisma.usuario.update.mockRejectedValue(new Error("Database unavailable"));

    await expect(usuarioRepository.atualizaUsuario("1", { nome: "Joao Atualizado" })).rejects.toHaveProperty(
      "message",
      "Não foi possível atualizar o usuário.",
    );
  });

  it("should update password successfully", async () => {
    const usuarioAtualizado = { id: "1", senha: "nova-senha-hash" };
    mockPrisma.usuario.update.mockResolvedValue(usuarioAtualizado);

    await expect(usuarioRepository.atualizaSenhaUsuario("1", "nova-senha-hash")).resolves.toEqual(usuarioAtualizado);
  });

  it("should map update password errors to 500", async () => {
    mockPrisma.usuario.update.mockRejectedValue(new Error("Database unavailable"));

    await expect(usuarioRepository.atualizaSenhaUsuario("1", "nova-senha-hash")).rejects.toHaveProperty(
      "message",
      "Não foi possível atualizar a senha do usuário.",
    );
  });

  it("should return password when buscarSenhaUsuario succeeds", async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue({ senha: "senha-hash" });

    await expect(usuarioRepository.buscarSenhaUsuario("1")).resolves.toBe("senha-hash");
  });

  it("should map buscarSenhaUsuario errors to 500", async () => {
    mockPrisma.usuario.findUnique.mockRejectedValue(new Error("Database unavailable"));

    await expect(usuarioRepository.buscarSenhaUsuario("1")).rejects.toHaveProperty(
      "message",
      "Não foi possível buscar a senha do usuário.",
    );
  });
});
