import { usuarioRepository } from './usuarioRepository';
import { PrismaClient } from '@prisma/client';

// Mock do PrismaClient
jest.mock('@prisma/client', () => {
  const mockUsuario = {
    findUnique: jest.fn(),
    create: jest.fn()
  };

  return {
    PrismaClient: jest.fn(() => ({
      usuario: mockUsuario
    }))
  };
});

describe('UsuarioRepository', () => {
  let mockPrisma: any;

  const mockUsuario = {
    id: '1',
    nome: 'João Silva',
    email: 'joao@example.com',
    senha: 'senha123',
    createdAt: new Date('2026-04-18'),
    updatedAt: new Date('2026-04-18')
  };

  beforeEach(() => {
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('buscarUsuarioPorEmail', () => {
    it('should find a user by email when it exists', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario);

      const result = await usuarioRepository.buscarUsuarioPorEmail('joao@example.com');

      expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@example.com' }
      });
      expect(result).toEqual(mockUsuario);
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      const result = await usuarioRepository.buscarUsuarioPorEmail('nonexistent@example.com');

      expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' }
      });
      expect(result).toBeNull();
    });

    it('should handle different email formats', async () => {
      const emails = [
        'user@example.com',
        'user+tag@example.co.uk',
        'user.name@subdomain.example.com'
      ];

      for (const email of emails) {
        mockPrisma.usuario.findUnique.mockResolvedValue(null);

        await usuarioRepository.buscarUsuarioPorEmail(email);

        expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
          where: { email }
        });
      }
    });

    it('should call findUnique with correct email parameter', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario);

      await usuarioRepository.buscarUsuarioPorEmail('test@example.com');

      const callArgs = (mockPrisma.usuario.findUnique as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.email).toBe('test@example.com');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.usuario.findUnique.mockRejectedValue(dbError);

      await expect(usuarioRepository.buscarUsuarioPorEmail('joao@example.com')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('criarUsuario', () => {
    it('should create a user successfully', async () => {
      mockPrisma.usuario.create.mockResolvedValue(mockUsuario);

      const userData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      };

      const result = await usuarioRepository.criarUsuario(userData);

      expect(mockPrisma.usuario.create).toHaveBeenCalledWith({
        data: userData
      });
      expect(result).toEqual(mockUsuario);
    });

    it('should return created user with correct properties', async () => {
      const createdUser = {
        id: '123abc',
        nome: 'Maria Santos',
        email: 'maria@example.com',
        senha: 'senha456',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.usuario.create.mockResolvedValue(createdUser);

      const userData = {
        nome: 'Maria Santos',
        email: 'maria@example.com',
        senha: 'senha456'
      };

      const result = await usuarioRepository.criarUsuario(userData);

      expect(result.id).toBe('123abc');
      expect(result.nome).toBe('Maria Santos');
      expect(result.email).toBe('maria@example.com');
      expect(result.senha).toBe('senha456');
    });

    it('should pass user data correctly to create', async () => {
      mockPrisma.usuario.create.mockResolvedValue(mockUsuario);

      const userData = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'testsenha123'
      };

      await usuarioRepository.criarUsuario(userData);

      const callArgs = (mockPrisma.usuario.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.data).toEqual(userData);
    });

    it('should handle database errors during creation', async () => {
      const dbError = new Error('Unique constraint failed on email');
      mockPrisma.usuario.create.mockRejectedValue(dbError);

      const userData = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      };

      await expect(usuarioRepository.criarUsuario(userData)).rejects.toThrow(
        'Unique constraint failed on email'
      );
    });

    it('should return user object with timestamp fields', async () => {
      const createdAtTime = new Date('2026-04-18T10:00:00Z');
      const updatedAtTime = new Date('2026-04-18T10:00:00Z');

      const userWithTimestamps = {
        id: '1',
        nome: 'Test',
        email: 'test@example.com',
        senha: 'senha',
        createdAt: createdAtTime,
        updatedAt: updatedAtTime
      };

      mockPrisma.usuario.create.mockResolvedValue(userWithTimestamps);

      const userData = {
        nome: 'Test',
        email: 'test@example.com',
        senha: 'senha'
      };

      const result = await usuarioRepository.criarUsuario(userData);

      expect(result.createdAt).toBe(createdAtTime);
      expect(result.updatedAt).toBe(updatedAtTime);
    });

    it('should create multiple users with different data', async () => {
      const usersData = [
        { nome: 'User 1', email: 'user1@example.com', senha: 'pass1' },
        { nome: 'User 2', email: 'user2@example.com', senha: 'pass2' },
        { nome: 'User 3', email: 'user3@example.com', senha: 'pass3' }
      ];

      for (let i = 0; i < usersData.length; i++) {
        const createdUser = {
          id: String(i + 1),
          ...usersData[i],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockPrisma.usuario.create.mockResolvedValue(createdUser);

        const result = await usuarioRepository.criarUsuario(usersData[i]);

        expect(result.id).toBe(String(i + 1));
        expect(result.email).toBe(usersData[i].email);
      }
    });
  });
});
