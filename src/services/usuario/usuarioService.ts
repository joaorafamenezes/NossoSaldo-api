import { createHash, randomBytes } from "crypto";
import createHttpError from "http-errors";
import iRedefinirSenhaComToken from "../../@types/usuario/iRedefinirSenhaComToken";
import iSolicitarResetSenha from "../../@types/usuario/iSolicitarResetSenha";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { passwordResetTokenRepository } from "../../repositories/usuario/passwordResetTokenRepository";
import iCriarUsuario from "../../@types/usuario/iCriarUsuario";
import { mailer } from "../../lib/mailer";
import autentication from "../../secure/autentication";
import iLogin from "../../@types/iLogin";
import authorization from "../../secure/authorization";

const passwordResetExpiresInMinutes = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES ?? "60");

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildPasswordResetValidationUrl(token: string) {
  const frontendResetPasswordUrl = process.env.FRONTEND_RESET_PASSWORD_URL ?? "http://localhost:5173/redefinir-senha";
  const redirectUrl = new URL(frontendResetPasswordUrl);
  redirectUrl.searchParams.set("token", token);

  return redirectUrl.toString();
}

class UsuarioService {
  async criarUsuario(data: iCriarUsuario) {
    const nome = data.nome;
    const email = data.email;
    const senha = autentication.hasPassword(data.senha);

    const usuarioExiste = await usuarioRepository.buscarUsuarioPorEmail(email);

    if (usuarioExiste) {
      throw createHttpError(409, "UsuÃ¡rio jÃ¡ existe com esse email no banco de dados.");
    }

    return await usuarioRepository.criarUsuario({
      nome,
      email,
      senha,
    });
  }

  async login(data: iLogin) {
    const email = data.email;
    const senha = data.senha;

    const usuario = await usuarioRepository.buscarUsuarioPorEmail(email);

    if (!usuario) {
      return null;
    }

    if (autentication.checkPassword(senha, usuario.senha)) {
      const token = await authorization.sign(usuario.id);

      if (!token) {
        throw createHttpError(500, "NÃ£o foi possÃ­vel gerar o token.");
      }

      return { token };
    }

    return null;
  }

  async listarUsuarios() {
    return await usuarioRepository.listarUsuarios();
  }

  async listarUsuarioPorId(id: string) {
    return await usuarioRepository.listarUsuarioPorId(id);
  }

  async atualizaUsuario(id: string, dadosAtualizados: Partial<iCriarUsuario>) {
    try {
      return await usuarioRepository.atualizaUsuario(id, dadosAtualizados);
    } catch (error) {
      throw createHttpError(500, "NÃ£o foi possÃ­vel atualizar o usuÃ¡rio.");
    }
  }

  async atualizaSenhaUsuario(id: string, novaSenha: string) {
    try {
      const senhaAtual = await usuarioRepository.buscarSenhaUsuario(id);

      if (!senhaAtual) {
        throw createHttpError(404, "Usuario nao encontrado.");
      }

      const mesmaSenha = autentication.checkPassword(novaSenha, senhaAtual);

      if (mesmaSenha) {
        throw createHttpError(400, "A nova senha deve ser diferente da senha atual.");
      }

      const senhaHash = autentication.hasPassword(novaSenha);
      await usuarioRepository.atualizaSenhaUsuario(id, senhaHash);

      return true;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }

      throw createHttpError(500, "NÃ£o foi possÃ­vel atualizar a senha do usuÃ¡rio.");
    }
  }

  async solicitarRecuperacaoSenha(data: iSolicitarResetSenha) {
    const usuario = await usuarioRepository.buscarUsuarioPorEmail(data.email);

    if (!usuario) {
      return {
        message: "Se o email informado existir, enviaremos um link para redefinicao de senha.",
      };
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + passwordResetExpiresInMinutes * 60 * 1000);

    await passwordResetTokenRepository.invalidarTokensAtivosPorUsuarioId(usuario.id);
    await passwordResetTokenRepository.criarToken({
      tokenHash,
      usuarioId: usuario.id,
      expiresAt,
    });

    await mailer.sendPasswordResetEmail({
      to: usuario.email,
      nome: usuario.nome,
      validationUrl: buildPasswordResetValidationUrl(token),
      expiresInMinutes: passwordResetExpiresInMinutes,
    });

    return {
      message: "Se o email informado existir, enviaremos um link para redefinicao de senha.",
    };
  }

  async validarTokenRecuperacaoSenha(token: string) {
    const tokenHash = hashResetToken(token);
    const registro = await passwordResetTokenRepository.buscarTokenValidoPorHash(tokenHash);

    if (!registro) {
      throw createHttpError(400, "Token de recuperacao invalido ou expirado.");
    }

    return true;
  }

  async redefinirSenhaComToken(data: iRedefinirSenhaComToken) {
    const tokenHash = hashResetToken(data.token);
    const registro = await passwordResetTokenRepository.buscarTokenValidoPorHash(tokenHash);

    if (!registro) {
      throw createHttpError(400, "Token de recuperacao invalido ou expirado.");
    }

    await this.atualizaSenhaUsuario(registro.usuarioId, data.senha);
    await passwordResetTokenRepository.marcarTokenComoUsado(registro.id);

    return true;
  }
}

export const usuarioService = new UsuarioService();
