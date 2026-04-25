import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";

const prisma = new PrismaClient();

type CriarUsuarioInput = {
  nome: string;
  email: string;
  senha: string;
};

class UsuarioRepository {
  async buscarUsuarioPorEmail(email: string) {
    try {
      return await prisma.usuario.findUnique({
        where: { email },
      });
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível buscar o usuário por email.");
    }
  }

  async criarUsuario(usuario: CriarUsuarioInput) {
    try {
      return await prisma.usuario.create({
        data: usuario,
      });
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível criar o usuário.");
    }
  }

  async listarUsuarios() {
    try {
      return await prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível listar os usuários.");
    }
  }

  async listarUsuarioPorId(id: string) {
    try {
      return await prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível buscar o usuário.");
    }
  }

  async atualizaUsuario(id: string, dadosAtualizados: Partial<CriarUsuarioInput>) {
    try {
      return await prisma.usuario.update({
        where: { id },
        data: dadosAtualizados,
        select: {
          id: true,
          nome: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível atualizar o usuário.");
    }
  }

  async atualizaSenhaUsuario(id: string, novaSenha: string) {
    try {
      const atualizaSenha = await prisma.usuario.update({
        where: { id },
        data: { senha: novaSenha },
      });

      if (!atualizaSenha) {
        throw createRepositoryError(null, "Usuário não encontrado para atualizar a senha.");
      }

      return atualizaSenha;

    } catch (error) {
      throw createRepositoryError(error, "Não foi possível atualizar a senha do usuário.");
    }    
  }

  async buscarSenhaUsuario(id: string) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: { senha: true },
      });

      if (!usuario) {
        throw createRepositoryError(null, "Usuário não encontrado.");
      }

      return usuario.senha;
    } catch (error) {
      throw createRepositoryError(error, "Não foi possível buscar a senha do usuário.");
    }
  }
}

export const usuarioRepository = new UsuarioRepository();
