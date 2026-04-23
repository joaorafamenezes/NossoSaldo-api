import createHttpError from "http-errors";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import iCriarUsuario from "../../@types/iCriarUsuario";
import autentication from "../../secure/autentication";
import iLogin from "../../@types/iLogin";
import authorization from "../../secure/authorization";

class UsuarioService {
  async criarUsuario(data: iCriarUsuario) {
    const nome = data.nome;
    const email = data.email;
    const senha = autentication.hasPassword(data.senha);

    const usuarioExiste = await usuarioRepository.buscarUsuarioPorEmail(email);

    if (usuarioExiste) {
      throw createHttpError(409, "Usuário já existe com esse email no banco de dados.");
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
        throw createHttpError(500, "Não foi possível gerar o token.");
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
}

export const usuarioService = new UsuarioService();
