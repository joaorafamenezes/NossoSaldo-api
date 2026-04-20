import { Request, Response, NextFunction } from 'express';
import { usuarioControler } from './usuarioController';
import { usuarioService } from '../services/usuarioService';
import iCriarUsuarioSchema from '../@types/iCriarUsuario';

jest.mock('../services/usuarioService');

describe('UsuarioController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockUsuarioCriado = {
    id: '1',
    nome: 'Joao Silva',
    email: 'joao@example.com',
    senha: 'senha-criptografada',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockRequest = {
      body: {
        nome: 'Joao Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      } as iCriarUsuarioSchema
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('criarUsuario', () => {
    it('should create a user successfully and return 201', async () => {
      (usuarioService.criarUsuario as jest.Mock).mockResolvedValue(mockUsuarioCriado);

      await usuarioControler.criarUsuario(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(usuarioService.criarUsuario).toHaveBeenCalledWith({
        nome: 'Joao Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUsuarioCriado);
    });

    it('should call next with error when service throws', async () => {
      const error = new Error('Email ja existe');
      (usuarioService.criarUsuario as jest.Mock).mockRejectedValue(error);

      await usuarioControler.criarUsuario(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should pass request body data to service', async () => {
      const customData = {
        nome: 'Maria Santos',
        email: 'maria@example.com',
        senha: 'senha456'
      };

      mockRequest.body = customData;

      (usuarioService.criarUsuario as jest.Mock).mockResolvedValue({
        ...mockUsuarioCriado,
        ...customData,
        senha: 'senha-maria-criptografada'
      });

      await usuarioControler.criarUsuario(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(usuarioService.criarUsuario).toHaveBeenCalledWith(customData);
    });

    it('should call next when service throws an unexpected error', async () => {
      const error = new Error('Falha inesperada');
      (usuarioService.criarUsuario as jest.Mock).mockRejectedValue(error);

      await usuarioControler.criarUsuario(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should return created user with all properties', async () => {
      const userWithId = {
        id: '123abc',
        nome: 'Joao Silva',
        email: 'joao@example.com',
        senha: 'senha-criptografada',
        createdAt: new Date('2026-04-18'),
        updatedAt: new Date('2026-04-18')
      };

      (usuarioService.criarUsuario as jest.Mock).mockResolvedValue(userWithId);

      await usuarioControler.criarUsuario(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        id: '123abc',
        nome: 'Joao Silva',
        email: 'joao@example.com',
        senha: 'senha-criptografada'
      }));
    });
  });
});
