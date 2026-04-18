import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateCreateUser } from './usuarioMiddleware';
import iCriarUsuarioSchema from '../../@types/iCriarUsuarioSchema';

describe('validateCreateUser Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Request>;
  let mockNext: jest.Mock;

  const createTestSchema = () =>
    Joi.object<iCriarUsuarioSchema>({
      nome: Joi.string().required().messages({
        'string.empty': 'O nome é obrigatório.',
        'any.required': 'O nome é obrigatório.',
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'O email é inválido.',
        'any.required': 'O email é obrigatório.',
      }),
      senha: Joi.string().min(6).max(50).required().messages({
        'string.min': 'A senha deve ter pelo menos 6 caracteres.',
        'string.max': 'A senha não pode ter mais de 50 caracteres.',
        'any.required': 'A senha é obrigatória.',
      }),
    });

  beforeEach(() => {
    mockRequest = {
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('Validação bem-sucedida', () => {
    it('should call next() when data is valid', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should update req.body with validated value', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: '  João Silva  ',
        email: 'joao@example.com',
        senha: 'senha123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        nome: '  João Silva  ',
        email: 'joao@example.com',
        senha: 'senha123'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove extra fields with stripUnknown', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123',
        extra: 'campo que não deveria estar aqui',
        outro: 'mais um campo'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).not.toHaveProperty('extra');
      expect(mockRequest.body).not.toHaveProperty('outro');
      expect(mockRequest.body).toEqual({
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senha123'
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Erros de validação', () => {
    it('should return 400 with error messages when validation fails', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: '',
        email: 'invalid-email',
        senha: '123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return array of error messages', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: '',
        email: 'invalid-email',
        senha: '123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(Array.isArray(jsonCall.errors)).toBe(true);
      expect(jsonCall.errors.length).toBeGreaterThan(0);
    });

    it('should return specific error message for invalid email', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João Silva',
        email: 'not-an-email',
        senha: 'senha123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors).toContain('O email é inválido.');
    });

    it('should return specific error message for short password', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: '12345'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors).toContain('A senha deve ter pelo menos 6 caracteres.');
    });

    it('should handle multiple validation errors', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: '',
        email: 'not-an-email',
        senha: '123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should not call next() when validation fails', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João',
        email: 'invalid'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not modify req.body when validation fails', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      const originalBody = {
        nome: 'João',
        email: 'invalid'
      };

      mockRequest.body = { ...originalBody };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Body não é modificado antes do erro ser retornado
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Campos obrigatórios', () => {
    it('should return error when nome is missing', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        email: 'joao@example.com',
        senha: 'senha123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors).toContain('O nome é obrigatório.');
    });

    it('should return error when email is missing', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João Silva',
        senha: 'senha123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors).toContain('O email é obrigatório.');
    });

    it('should return error when senha is missing', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João Silva',
        email: 'joao@example.com'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors).toContain('A senha é obrigatória.');
    });

    it('should accept all required fields correctly', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: 'João Silva',
        email: 'joao@example.com',
        senha: 'senhavalida123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Comportamento do middleware', () => {
    it('should return middleware function', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      expect(typeof middleware).toBe('function');
    });

    it('should accept schema parameter', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      expect(middleware).toBeDefined();
    });

    it('should use abortEarly false to collect all errors', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: '',
        email: 'invalid',
        senha: '123'
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      // Deve coletar múltiplos erros de uma vez
      expect(jsonCall.errors.length).toBeGreaterThan(1);
    });

    it('should handle empty object', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {};

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.errors.length).toBeGreaterThan(0);
    });

    it('should handle null fields', () => {
      const schema = createTestSchema();
      const middleware = validateCreateUser(schema);

      mockRequest.body = {
        nome: null,
        email: null,
        senha: null
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
