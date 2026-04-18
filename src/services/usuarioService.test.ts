import { usuarioService } from './usuarioService';
import { usuarioRepository } from '../repositories/usuarioRepository';
import iCriarUsuarioSchema from '../@types/iCriarUsuarioSchema';

// Mock do usuarioRepository
jest.mock('../repositories/usuarioRepository');

describe('UsuarioService', () => {
  const mockUsuarioData: iCriarUsuarioSchema = {
    nome: 'João Silva',
    email: 'joao@example.com',
    senha: 'senha123'
  };

  const mockUsuarioCriado = {
    id: '1',
    nome: 'João Silva',
    email: 'joao@example.com',
    senha: 'senha123',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarUsuario', () => {
    it('should create a user successfully when email does not exist', async () => {
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue(mockUsuarioCriado);

      const result = await usuarioService.criarUsuario(mockUsuarioData);

      expect(usuarioRepository.buscarUsuarioPorEmail).toHaveBeenCalledWith('joao@example.com');
      expect(usuarioRepository.criarUsuario).toHaveBeenCalledWith({
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      });
      expect(result).toEqual(mockUsuarioCriado);
    });

    it('should throw error when email already exists', async () => {
      const existingUser = { ...mockUsuarioCriado, id: '2' };
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(existingUser);

      await expect(usuarioService.criarUsuario(mockUsuarioData)).rejects.toThrow(
        'Usuário já existe com esse email no banco de dados.'
      );

      expect(usuarioRepository.buscarUsuarioPorEmail).toHaveBeenCalledWith('joao@example.com');
      expect(usuarioRepository.criarUsuario).not.toHaveBeenCalled();
    });

    it('should extract nome, email, and senha from data', async () => {
      const customData: iCriarUsuarioSchema = {
        nome: 'Maria Santos',
        email: 'maria@example.com',
        senha: 'senha456'
      };

      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue({
        ...mockUsuarioCriado,
        ...customData
      });

      await usuarioService.criarUsuario(customData);

      expect(usuarioRepository.criarUsuario).toHaveBeenCalledWith({
        nome: 'Maria Santos',
        email: 'maria@example.com',
        senha: 'senha456'
      });
    });

    it('should return created user with all properties', async () => {
      const userWithAllProperties = {
        id: '123abc',
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123',
        createdAt: new Date('2026-04-18'),
        updatedAt: new Date('2026-04-18')
      };

      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue(userWithAllProperties);

      const result = await usuarioService.criarUsuario(mockUsuarioData);

      expect(result).toEqual(userWithAllProperties);
      expect(result.id).toBe('123abc');
      expect(result.nome).toBe('João Silva');
      expect(result.email).toBe('joao@example.com');
    });

    it('should check email existence before creating user', async () => {
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue(mockUsuarioCriado);

      await usuarioService.criarUsuario(mockUsuarioData);

      const checkEmailCall = (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mock.invocationCallOrder[0];
      const createUserCall = (usuarioRepository.criarUsuario as jest.Mock).mock.invocationCallOrder[0];

      expect(checkEmailCall).toBeLessThan(createUserCall);
    });

    it('should handle different email addresses correctly', async () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ];

      for (const email of emails) {
        jest.clearAllMocks();
        
        (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
        (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue({
          ...mockUsuarioCriado,
          email
        });

        await usuarioService.criarUsuario({
          ...mockUsuarioData,
          email
        });

        expect(usuarioRepository.buscarUsuarioPorEmail).toHaveBeenCalledWith(email);
      }
    });

    it('should throw error immediately when email exists without creating user', async () => {
      const existingUser = { ...mockUsuarioCriado };
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(existingUser);

      try {
        await usuarioService.criarUsuario(mockUsuarioData);
      } catch (error) {
        // Expected error
      }

      expect(usuarioRepository.criarUsuario).not.toHaveBeenCalled();
    });
  });
});
