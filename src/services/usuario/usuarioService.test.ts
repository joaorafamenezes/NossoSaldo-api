import { usuarioService } from "./usuarioService";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { passwordResetTokenRepository } from "../../repositories/usuario/passwordResetTokenRepository";
import { emailVerificationTokenRepository } from "../../repositories/usuario/emailVerificationTokenRepository";
import iCriarUsuarioSchema from "../../@types/usuario/iCriarUsuario";
import iLogin from "../../@types/iLogin";
import { mailer } from "../../lib/mailer";
import autentication from "../../secure/autentication";
import authorization from "../../secure/authorization";

jest.mock("../../repositories/usuario/usuarioRepository");
jest.mock("../../repositories/usuario/passwordResetTokenRepository");
jest.mock("../../repositories/usuario/emailVerificationTokenRepository");
jest.mock("../../lib/mailer");
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
    emailVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsuarioListagem = {
    id: "1",
    nome: "Joao Silva",
    email: "joao@example.com",
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (autentication.hasPassword as jest.Mock).mockReturnValue("senha-criptografada");
    (autentication.checkPassword as jest.Mock).mockReturnValue(false);
  });

  it("should create a user successfully when email does not exist", async () => {
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
    (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue(mockUsuarioCriado);
    (emailVerificationTokenRepository.invalidarTokensAtivosPorUsuarioId as jest.Mock).mockResolvedValue({ count: 0 });
    (emailVerificationTokenRepository.criarToken as jest.Mock).mockResolvedValue({ id: "email-token-1" });
    (mailer.sendEmailVerificationEmail as jest.Mock).mockResolvedValue(undefined);

    const result = await usuarioService.criarUsuario(mockUsuarioData);

    expect(usuarioRepository.criarUsuario).toHaveBeenCalledWith({
      nome: "Joao Silva",
      email: "joao@example.com",
      senha: "senha-criptografada",
    });
    expect(result).toEqual(mockUsuarioCriado);
    expect(emailVerificationTokenRepository.invalidarTokensAtivosPorUsuarioId).toHaveBeenCalledWith("1");
    expect(emailVerificationTokenRepository.criarToken).toHaveBeenCalledTimes(1);
    expect(mailer.sendEmailVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "joao@example.com",
        verificationUrl: expect.stringMatching(/^http:\/\/localhost:5173\/validar-email\?token=/),
      }),
    );
  });

  it("should throw 409 when email already exists", async () => {
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(mockUsuarioCriado);

    await expect(usuarioService.criarUsuario(mockUsuarioData)).rejects.toHaveProperty(
      "message",
      "UsuÃ¡rio jÃ¡ existe com esse email no banco de dados.",
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
      emailVerifiedAt: new Date(),
    });

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
      emailVerifiedAt: new Date(),
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
      emailVerifiedAt: new Date(),
    });
    (autentication.checkPassword as jest.Mock).mockReturnValue(true);
    (authorization.sign as jest.Mock).mockResolvedValue(null);

    await expect(usuarioService.login(loginData)).rejects.toHaveProperty(
      "message",
      "NÃ£o foi possÃ­vel gerar o token.",
    );
  });

  it("should throw 403 when email is not verified", async () => {
    const loginData: iLogin = {
      email: "joao@example.com",
      senha: "senha123",
    };
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue({
      id: "user-1",
      senha: "hash-da-senha",
      emailVerifiedAt: null,
    });

    await expect(usuarioService.login(loginData)).rejects.toHaveProperty(
      "message",
      "Confirme seu email antes de acessar sua conta.",
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
      "NÃ£o foi possÃ­vel atualizar o usuÃ¡rio.",
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

  it("should throw 400 when the new password matches the current password", async () => {
    (usuarioRepository.buscarSenhaUsuario as jest.Mock).mockResolvedValue("hash-antigo");
    (autentication.checkPassword as jest.Mock).mockReturnValue(true);

    await expect(usuarioService.atualizaSenhaUsuario("1", "novaSenha123")).rejects.toHaveProperty(
      "message",
      "A nova senha deve ser diferente da senha atual.",
    );
  });

  it("should throw 500 when password update fails", async () => {
    (usuarioRepository.buscarSenhaUsuario as jest.Mock).mockResolvedValue("hash-antigo");
    (usuarioRepository.atualizaSenhaUsuario as jest.Mock).mockRejectedValue(new Error("falha"));

    await expect(usuarioService.atualizaSenhaUsuario("1", "novaSenha123")).rejects.toHaveProperty(
      "message",
      "NÃ£o foi possÃ­vel atualizar a senha do usuÃ¡rio.",
    );
  });

  it("should send a password reset email when the user exists", async () => {
    process.env.FRONTEND_RESET_PASSWORD_URL = "http://localhost:5173/redefinir-senha";
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue({
      id: "user-1",
      nome: "Joao Silva",
      email: "joao@example.com",
    });
    (passwordResetTokenRepository.invalidarTokensAtivosPorUsuarioId as jest.Mock).mockResolvedValue({ count: 1 });
    (passwordResetTokenRepository.criarToken as jest.Mock).mockResolvedValue({ id: "token-1" });
    (mailer.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

    await expect(usuarioService.solicitarRecuperacaoSenha({ email: "joao@example.com" })).resolves.toEqual({
      message: "Se o email informado existir, enviaremos um link para redefinicao de senha.",
    });
    expect(passwordResetTokenRepository.invalidarTokensAtivosPorUsuarioId).toHaveBeenCalledWith("user-1");
    expect(passwordResetTokenRepository.criarToken).toHaveBeenCalledTimes(1);
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "joao@example.com",
        validationUrl: expect.stringMatching(/^http:\/\/localhost:5173\/redefinir-senha\?token=/),
      }),
    );
  });

  it("should not fail password reset request when the user does not exist", async () => {
    (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);

    await expect(usuarioService.solicitarRecuperacaoSenha({ email: "joao@example.com" })).resolves.toEqual({
      message: "Se o email informado existir, enviaremos um link para redefinicao de senha.",
    });
    expect(passwordResetTokenRepository.criarToken).not.toHaveBeenCalled();
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should validate a password reset token successfully", async () => {
    (passwordResetTokenRepository.buscarTokenValidoPorHash as jest.Mock).mockResolvedValue({
      id: "token-1",
      usuarioId: "user-1",
    });

    await expect(usuarioService.validarTokenRecuperacaoSenha("token-valido")).resolves.toBe(true);
  });

  it("should throw 400 when password reset token is invalid", async () => {
    (passwordResetTokenRepository.buscarTokenValidoPorHash as jest.Mock).mockResolvedValue(null);

    await expect(usuarioService.validarTokenRecuperacaoSenha("token-invalido")).rejects.toHaveProperty(
      "message",
      "Token de recuperacao invalido ou expirado.",
    );
  });

  it("should reset password with a valid token", async () => {
    (passwordResetTokenRepository.buscarTokenValidoPorHash as jest.Mock).mockResolvedValue({
      id: "token-1",
      usuarioId: "user-1",
    });
    (usuarioRepository.buscarSenhaUsuario as jest.Mock).mockResolvedValue("hash-antigo");
    (usuarioRepository.atualizaSenhaUsuario as jest.Mock).mockResolvedValue({ id: "user-1" });
    (passwordResetTokenRepository.marcarTokenComoUsado as jest.Mock).mockResolvedValue({ id: "token-1" });

    await expect(usuarioService.redefinirSenhaComToken({ token: "token-valido", senha: "novaSenha123" })).resolves.toBe(true);
    expect(passwordResetTokenRepository.marcarTokenComoUsado).toHaveBeenCalledWith("token-1");
  });

  it("should throw 400 when resetting password with invalid token", async () => {
    (passwordResetTokenRepository.buscarTokenValidoPorHash as jest.Mock).mockResolvedValue(null);

    await expect(usuarioService.redefinirSenhaComToken({ token: "token-invalido", senha: "novaSenha123" })).rejects.toHaveProperty(
      "message",
      "Token de recuperacao invalido ou expirado.",
    );
  });
});
