import { usuarioService } from "./usuarioService";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import iCriarUsuarioSchema from "../../@types/usuario/iCriarUsuario";
import iLogin from "../../@types/iLogin";
import autentication from "../../secure/autentication";
import authorization from "../../secure/authorization";

jest.mock("../../repositories/usuario/usuarioRepository");
jest.mock("../../secure/autentication");
jest.mock("../../secure/authorization");

describe("UsuarioService", () => {
  const mockUsuarioData: iCriarUsuarioSchema = {
    nome: "Joao Silva",
    email: "joao@example.com",
    senha: "senha123",
  };

  const mockUsuarioCriado = {
    id: "1",
    nome: "Joao Silva",
    email: "joao@example.com",
    senha: "senha-criptografada",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsuarioListagem = {
    id: "1",
    nome: "Joao Silva",
    email: "joao@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (autentication.hasPassword as jest.Mock).mockReturnValue("senha-criptografada");
  });

  it("should create a user successfully when email does not exist", async () => {
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
    (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue(mockUsuarioCriado);

    const result = await usuarioService.criarUsuario(mockUsuarioData);

    expect(usuarioRepository.criarUsuario).toHaveBeenCalledWith({
      nome: "Joao Silva",
      email: "joao@example.com",
      senha: "senha-criptografada",
    });
    expect(result).toEqual(mockUsuarioCriado);
  });

  it("should throw 409 when email already exists", async () => {
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(mockUsuarioCriado);

    await expect(usuarioService.criarUsuario(mockUsuarioData)).rejects.toHaveProperty(
      "message",
      "Usuário já existe com esse email no banco de dados.",
    );
  });

  it("should return null when user is not found during login", async () => {
    const loginData: iLogin = {
      email: "joao@example.com",
      senha: "senha123",
    };
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);

    await expect(usuarioService.login(loginData)).resolves.toBeNull();
  });

  it("should return null when password is invalid", async () => {
    const loginData: iLogin = {
      email: "joao@example.com",
      senha: "senha123",
    };
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue({
      id: "user-1",
      senha: "hash-da-senha",
    });
    (autentication.checkPassword as jest.Mock).mockReturnValue(false);

    await expect(usuarioService.login(loginData)).resolves.toBeNull();
  });

  it("should return token when login succeeds", async () => {
    const loginData: iLogin = {
      email: "joao@example.com",
      senha: "senha123",
    };
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue({
      id: "user-1",
      senha: "hash-da-senha",
    });
    (autentication.checkPassword as jest.Mock).mockReturnValue(true);
    (authorization.sign as jest.Mock).mockResolvedValue("jwt-token-valido");

    await expect(usuarioService.login(loginData)).resolves.toEqual({ token: "jwt-token-valido" });
  });

  it("should throw 500 when token generation fails", async () => {
    const loginData: iLogin = {
      email: "joao@example.com",
      senha: "senha123",
    };
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue({
      id: "user-1",
      senha: "hash-da-senha",
    });
    (autentication.checkPassword as jest.Mock).mockReturnValue(true);
    (authorization.sign as jest.Mock).mockResolvedValue(null);

    await expect(usuarioService.login(loginData)).rejects.toHaveProperty(
      "message",
      "Não foi possível gerar o token.",
    );
  });

  it("should list users successfully", async () => {
    (usuarioRepository.listarUsuarios as jest.Mock).mockResolvedValue([mockUsuarioListagem]);

    await expect(usuarioService.listarUsuarios()).resolves.toEqual([mockUsuarioListagem]);
    expect(usuarioRepository.listarUsuarios).toHaveBeenCalledTimes(1);
  });

  it("should get user by id successfully", async () => {
    (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(mockUsuarioListagem);

    await expect(usuarioService.listarUsuarioPorId("1")).resolves.toEqual(mockUsuarioListagem);
    expect(usuarioRepository.listarUsuarioPorId).toHaveBeenCalledWith("1");
  });

  it("should update user successfully", async () => {
    const dadosAtualizados = { nome: "Joao Atualizado" };
    const usuarioAtualizado = { ...mockUsuarioListagem, ...dadosAtualizados };

    (usuarioRepository.atualizaUsuario as jest.Mock).mockResolvedValue(usuarioAtualizado);

    await expect(usuarioService.atualizaUsuario("1", dadosAtualizados)).resolves.toEqual(usuarioAtualizado);
    expect(usuarioRepository.atualizaUsuario).toHaveBeenCalledWith("1", dadosAtualizados);
  });

  it("should throw 500 when user update fails", async () => {
    (usuarioRepository.atualizaUsuario as jest.Mock).mockRejectedValue(new Error("falha"));

    await expect(usuarioService.atualizaUsuario("1", { nome: "Joao Atualizado" })).rejects.toHaveProperty(
      "message",
      "Não foi possível atualizar o usuário.",
    );
  });

  it("should update password successfully", async () => {
    (usuarioRepository.buscarSenhaUsuario as jest.Mock).mockResolvedValue("hash-antigo");
    (usuarioRepository.atualizaSenhaUsuario as jest.Mock).mockResolvedValue({
      id: "1",
      senha: "senha-criptografada",
    });

    await expect(usuarioService.atualizaSenhaUsuario("1", "novaSenha123")).resolves.toBe(true);
    expect(autentication.hasPassword).toHaveBeenCalledWith("novaSenha123");
    expect(usuarioRepository.buscarSenhaUsuario).toHaveBeenCalledWith("1");
    expect(usuarioRepository.atualizaSenhaUsuario).toHaveBeenCalledWith("1", "senha-criptografada");
  });

  it("should throw 500 when password update fails", async () => {
    (usuarioRepository.buscarSenhaUsuario as jest.Mock).mockResolvedValue("hash-antigo");
    (usuarioRepository.atualizaSenhaUsuario as jest.Mock).mockRejectedValue(new Error("falha"));

    await expect(usuarioService.atualizaSenhaUsuario("1", "novaSenha123")).rejects.toHaveProperty(
      "message",
      "Não foi possível atualizar a senha do usuário.",
    );
  });

  it("should throw 500 when the new password matches the current password check", async () => {
    (usuarioRepository.buscarSenhaUsuario as jest.Mock).mockResolvedValue("novaSenha123");

    await expect(usuarioService.atualizaSenhaUsuario("1", "novaSenha123")).rejects.toHaveProperty(
      "message",
      "Não foi possível atualizar a senha do usuário.",
    );
  });
});
