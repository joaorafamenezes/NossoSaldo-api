import { PrismaClient } from "@prisma/client";
import { createRepositoryError } from "../../errors/httpError";
import { prisma as defaultPrisma } from "../../lib/prisma";
import {
  CriarUsuarioRepositoryInput,
  UsuarioRepositoryPort,
} from "../../ports/outbound/usuarioRepositoryPort";

export class PrismaUsuarioRepository implements UsuarioRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async buscarUsuarioPorEmail(email: string) {
    try {
      return await this.prisma.usuario.findUnique({
        where: { email },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar o usuario por email.");
    }
  }

  async criarUsuario(usuario: CriarUsuarioRepositoryInput) {
    try {
      return await this.prisma.usuario.create({
        data: usuario,
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o usuario.");
    }
  }

  async listarUsuarios() {
    try {
      return await this.prisma.usuario.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar os usuarios.");
    }
  }

  async listarUsuarioPorId(id: string) {
    try {
      return await this.prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar o usuario.");
    }
  }

  async atualizaUsuario(id: string, dadosAtualizados: Partial<CriarUsuarioRepositoryInput>) {
    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: dadosAtualizados,
        select: {
          id: true,
          nome: true,
          email: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel atualizar o usuario.");
    }
  }

  async atualizaSenhaUsuario(id: string, novaSenha: string) {
    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: { senha: novaSenha },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel atualizar a senha do usuario.");
    }
  }

  async buscarSenhaUsuario(id: string) {
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id },
        select: { senha: true },
      });

      if (!usuario) {
        throw createRepositoryError(null, "Usuario nao encontrado.");
      }

      return usuario.senha;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar a senha do usuario.");
    }
  }

  async marcarEmailComoVerificado(id: string) {
    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: { emailVerifiedAt: new Date() },
        select: {
          id: true,
          nome: true,
          email: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel marcar o email como verificado.");
    }
  }
}

export const usuarioRepository = new PrismaUsuarioRepository();
