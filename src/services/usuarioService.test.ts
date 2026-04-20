import { usuarioService } from './usuarioService';
import { usuarioRepository } from '../repositories/usuarioRepository';
import iCriarUsuarioSchema from '../@types/iCriarUsuario';
import iLogin from '../@types/iLogin';
import autentication from '../secure/autentication';
import authorization from '../secure/authorization';

jest.mock('../repositories/usuarioRepository');
jest.mock('../secure/autentication');
jest.mock('../secure/authorization');

describe('UsuarioService', () => {
  const mockUsuarioData: iCriarUsuarioSchema = {
    nome: 'Joao Silva',
    email: 'joao@example.com',
    senha: 'senha123'
  };

  const mockUsuarioCriado = {
    id: '1',
    nome: 'Joao Silva',
    email: 'joao@example.com',
    senha: 'senha-criptografada',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (autentication.hasPassword as jest.Mock).mockReturnValue('senha-criptografada');
  });

  describe('criarUsuario', () => {
    it('should create a user successfully when email does not exist', async () => {
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue(mockUsuarioCriado);

      const result = await usuarioService.criarUsuario(mockUsuarioData);

      expect(usuarioRepository.buscarUsuarioPorEmail).toHaveBeenCalledWith('joao@example.com');
      expect(autentication.hasPassword).toHaveBeenCalledWith('senha123');
      expect(usuarioRepository.criarUsuario).toHaveBeenCalledWith({
        nome: 'Joao Silva',
        email: 'joao@example.com',
        senha: 'senha-criptografada'
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
      (autentication.hasPassword as jest.Mock).mockReturnValue('senha-maria-criptografada');
      (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue({
        ...mockUsuarioCriado,
        ...customData,
        senha: 'senha-maria-criptografada'
      });

      await usuarioService.criarUsuario(customData);

      expect(usuarioRepository.criarUsuario).toHaveBeenCalledWith({
        nome: 'Maria Santos',
        email: 'maria@example.com',
        senha: 'senha-maria-criptografada'
      });
    });

    it('should return created user with all properties', async () => {
      const userWithAllProperties = {
        id: '123abc',
        nome: 'Joao Silva',
        email: 'joao@example.com',
        senha: 'senha-criptografada',
        createdAt: new Date('2026-04-18'),
        updatedAt: new Date('2026-04-18')
      };

      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);
      (usuarioRepository.criarUsuario as jest.Mock).mockResolvedValue(userWithAllProperties);

      const result = await usuarioService.criarUsuario(mockUsuarioData);

      expect(result).toEqual(userWithAllProperties);
      expect(result.id).toBe('123abc');
      expect(result.nome).toBe('Joao Silva');
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
        (autentication.hasPassword as jest.Mock).mockReturnValue('senha-criptografada');
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

    it('should throw when password hashing fails', async () => {
      const error = new Error('Falha ao criptografar senha');
      (autentication.hasPassword as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(usuarioService.criarUsuario(mockUsuarioData)).rejects.toThrow(
        'Falha ao criptografar senha'
      );

      expect(usuarioRepository.buscarUsuarioPorEmail).not.toHaveBeenCalled();
      expect(usuarioRepository.criarUsuario).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData: iLogin = {
      email: 'joao@example.com',
      senha: 'senha123'
    };

    const mockUsuarioDb = {
      id: 'user-1',
      nome: 'Joao Silva',
      email: 'joao@example.com',
      senha: 'hash-da-senha',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return null when user is not found', async () => {
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(null);

      const result = await usuarioService.login(loginData);

      expect(usuarioRepository.buscarUsuarioPorEmail).toHaveBeenCalledWith('joao@example.com');
      expect(autentication.checkPassword).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(mockUsuarioDb);
      (autentication.checkPassword as jest.Mock).mockReturnValue(false);

      const result = await usuarioService.login(loginData);

      expect(autentication.checkPassword).toHaveBeenCalledWith('senha123', 'hash-da-senha');
      expect(authorization.sign).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return token when login succeeds', async () => {
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(mockUsuarioDb);
      (autentication.checkPassword as jest.Mock).mockReturnValue(true);
      (authorization.sign as jest.Mock).mockResolvedValue('jwt-token-valido');

      const result = await usuarioService.login(loginData);

      expect(authorization.sign).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ token: 'jwt-token-valido' });
    });

    it('should throw when token generation fails', async () => {
      (usuarioRepository.buscarUsuarioPorEmail as jest.Mock).mockResolvedValue(mockUsuarioDb);
      (autentication.checkPassword as jest.Mock).mockReturnValue(true);
      (authorization.sign as jest.Mock).mockResolvedValue(null);

      await expect(usuarioService.login(loginData)).rejects.toThrow(/token/i);
    });
  });
});
