import { createHash, randomBytes } from "crypto";
import createHttpError from "http-errors";
import iRedefinirSenhaComToken from "../../@types/usuario/iRedefinirSenhaComToken";
import iSolicitarResetSenha from "../../@types/usuario/iSolicitarResetSenha";
import iCriarUsuario from "../../@types/usuario/iCriarUsuario";
import iLogin from "../../@types/iLogin";
import { mailer } from "../../lib/mailer";
import autentication from "../../secure/autentication";
import authorization from "../../secure/authorization";
import { emailVerificationTokenRepository } from "../../repositories/usuario/emailVerificationTokenRepository";
import { passwordResetTokenRepository } from "../../repositories/usuario/passwordResetTokenRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { EmailVerificationTokenRepositoryPort } from "../../ports/outbound/emailVerificationTokenRepositoryPort";
import { PasswordResetTokenRepositoryPort } from "../../ports/outbound/passwordResetTokenRepositoryPort";
import { UsuarioRepositoryPort } from "../../ports/outbound/usuarioRepositoryPort";

const passwordResetExpiresInMinutes = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES ?? "60");
const emailVerificationExpiresInMinutes = Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES ?? "1440");

function isEmailVerificationRequired() {
  return process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildPasswordResetValidationUrl(token: string) {
  const frontendResetPasswordUrl = process.env.FRONTEND_RESET_PASSWORD_URL ?? "http://localhost:5173/redefinir-senha";
  const redirectUrl = new URL(frontendResetPasswordUrl);
  redirectUrl.searchParams.set("token", token);
  return redirectUrl.toString();
}

function buildEmailVerificationUrl(token: string) {
  const frontendEmailVerificationUrl = process.env.FRONTEND_EMAIL_VERIFICATION_URL ?? "http://localhost:5173/validar-email";
  const redirectUrl = new URL(frontendEmailVerificationUrl);
  redirectUrl.searchParams.set("token", token);
  return redirectUrl.toString();
}

export class UsuarioService {
  constructor(
    private readonly usuarioRepository: UsuarioRepositoryPort,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepositoryPort,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepositoryPort,
  ) {}

  async criarUsuario(data: iCriarUsuario) {
    const senha = autentication.hasPassword(data.senha);
    const usuarioExiste = await this.usuarioRepository.buscarUsuarioPorEmail(data.email);

    if (usuarioExiste) {
      throw createHttpError(409, "Usuario ja existe com esse email no banco de dados.");
    }

    const usuarioCriado = await this.usuarioRepository.criarUsuario({
      nome: data.nome,
      email: data.email,
      senha,
    });

    if (!isEmailVerificationRequired()) {
      return usuarioCriado;
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + emailVerificationExpiresInMinutes * 60 * 1000);

    await this.emailVerificationTokenRepository.invalidarTokensAtivosPorUsuarioId(usuarioCriado.id);
    await this.emailVerificationTokenRepository.criarToken({ tokenHash, usuarioId: usuarioCriado.id, expiresAt });

    await mailer.sendEmailVerificationEmail({
      to: usuarioCriado.email,
      nome: usuarioCriado.nome,
      verificationUrl: buildEmailVerificationUrl(token),
      expiresInMinutes: emailVerificationExpiresInMinutes,
    });

    return usuarioCriado;
  }

  async login(data: iLogin) {
    const usuario = await this.usuarioRepository.buscarUsuarioPorEmail(data.email);

    if (!usuario) {
      return null;
    }

    if (isEmailVerificationRequired() && !usuario.emailVerifiedAt) {
      throw createHttpError(403, "Confirme seu email antes de acessar sua conta.");
    }

    if (!autentication.checkPassword(data.senha, usuario.senha)) {
      return null;
    }

    const token = await authorization.sign(usuario.id);

    if (!token) {
      throw createHttpError(500, "Nao foi possivel gerar o token.");
    }

    return { token };
  }

  async listarUsuarios() {
    return await this.usuarioRepository.listarUsuarios();
  }

  async listarUsuarioPorId(id: string) {
    return await this.usuarioRepository.listarUsuarioPorId(id);
  }

  async atualizaUsuario(id: string, dadosAtualizados: Partial<iCriarUsuario>) {
    try {
      return await this.usuarioRepository.atualizaUsuario(id, dadosAtualizados);
    } catch {
      throw createHttpError(500, "Nao foi possivel atualizar o usuario.");
    }
  }

  async atualizaSenhaUsuario(id: string, novaSenha: string) {
    try {
      const senhaAtual = await this.usuarioRepository.buscarSenhaUsuario(id);

      if (!senhaAtual) {
        throw createHttpError(404, "Usuario nao encontrado.");
      }

      if (autentication.checkPassword(novaSenha, senhaAtual)) {
        throw createHttpError(400, "A nova senha deve ser diferente da senha atual.");
      }

      await this.usuarioRepository.atualizaSenhaUsuario(id, autentication.hasPassword(novaSenha));
      return true;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }

      throw createHttpError(500, "Nao foi possivel atualizar a senha do usuario.");
    }
  }

  async solicitarRecuperacaoSenha(data: iSolicitarResetSenha) {
    const usuario = await this.usuarioRepository.buscarUsuarioPorEmail(data.email);

    if (!usuario) {
      return { message: "Se o email informado existir, enviaremos um link para redefinicao de senha." };
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + passwordResetExpiresInMinutes * 60 * 1000);

    await this.passwordResetTokenRepository.invalidarTokensAtivosPorUsuarioId(usuario.id);
    await this.passwordResetTokenRepository.criarToken({ tokenHash, usuarioId: usuario.id, expiresAt });

    await mailer.sendPasswordResetEmail({
      to: usuario.email,
      nome: usuario.nome,
      validationUrl: buildPasswordResetValidationUrl(token),
      expiresInMinutes: passwordResetExpiresInMinutes,
    });

    return { message: "Se o email informado existir, enviaremos um link para redefinicao de senha." };
  }

  async validarTokenRecuperacaoSenha(token: string) {
    const registro = await this.passwordResetTokenRepository.buscarTokenValidoPorHash(hashResetToken(token));

    if (!registro) {
      throw createHttpError(400, "Token de recuperacao invalido ou expirado.");
    }

    return true;
  }

  async validarEmail(token: string) {
    const registro = await this.emailVerificationTokenRepository.buscarTokenValidoPorHash(hashResetToken(token));

    if (!registro) {
      throw createHttpError(400, "Token de verificacao de email invalido ou expirado.");
    }

    const usuario = await this.usuarioRepository.marcarEmailComoVerificado(registro.usuarioId);
    await this.emailVerificationTokenRepository.marcarTokenComoUsado(registro.id);

    return { message: "Email verificado com sucesso.", usuario };
  }

  async redefinirSenhaComToken(data: iRedefinirSenhaComToken) {
    const registro = await this.passwordResetTokenRepository.buscarTokenValidoPorHash(hashResetToken(data.token));

    if (!registro) {
      throw createHttpError(400, "Token de recuperacao invalido ou expirado.");
    }

    await this.atualizaSenhaUsuario(registro.usuarioId, data.senha);
    await this.passwordResetTokenRepository.marcarTokenComoUsado(registro.id);

    return true;
  }
}

export const usuarioService = new UsuarioService(
  usuarioRepository,
  passwordResetTokenRepository,
  emailVerificationTokenRepository,
);
