import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { categoriaController } from './categoriaController';
import { categoriaService } from '../../services/categoria/categoriaService';

jest.mock('../../services/categoria/categoriaService');

describe('CategoriaController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {
        descricao: 'Alimentacao'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('criarCategoria', () => {
    it('should return 201 with created category', async () => {
      const categoriaCriada = {
        id: 'cat-1',
        descricao: 'Alimentacao'
      };

      (categoriaService.criarCategoria as jest.Mock).mockResolvedValue(categoriaCriada);

      await categoriaController.criarCategoria(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(categoriaService.criarCategoria).toHaveBeenCalledWith({
        descricao: 'Alimentacao'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith(categoriaCriada);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when create service throws', async () => {
      const error = new Error('Falha ao criar categoria');
      (categoriaService.criarCategoria as jest.Mock).mockRejectedValue(error);

      await categoriaController.criarCategoria(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('buscarTodasCategorias', () => {
    it('should return 200 with categories list', async () => {
      const categorias = [
        { id: 'cat-1', descricao: 'Alimentacao' },
        { id: 'cat-2', descricao: 'Moradia' }
      ];

      (categoriaService.buscarTodasCategorias as jest.Mock).mockResolvedValue(categorias);

      await categoriaController.buscarTodasCategorias(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(categoriaService.buscarTodasCategorias).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(categorias);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when list service throws', async () => {
      const error = new Error('Falha ao buscar categorias');
      (categoriaService.buscarTodasCategorias as jest.Mock).mockRejectedValue(error);

      await categoriaController.buscarTodasCategorias(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
