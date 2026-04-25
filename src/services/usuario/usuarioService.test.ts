import { usuarioService } from "./usuarioService";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import iCriarUsuarioSchema from "../../@types/usuario/iCriarUsuario";
import iLogin from "../../@types/iLogin";
import autentication from "../../secure/autentication";
import authorization from "../../secure/authorization";

jest.mock("../repositories/usuarioRepository");
jest.mock("../secure/autentication");
jest.mock("../secure/authorization");

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

    await expect(usuarioService.criarUsuario(mockUsuarioData)).rejects.toMatchObject({
      statusCode: 409,
      message: "Usuário já existe com esse email no banco de dados.",
    });
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

    await expect(usuarioService.login(loginData)).rejects.toMatchObject({
      statusCode: 500,
      message: "Não foi possível gerar o token.",
    });
  });
});
