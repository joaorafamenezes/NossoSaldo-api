import { categoriaService } from './categoriaService';
import { categoriaRepository } from '../../repositories/categoria/categoriaRepository';

jest.mock('../../repositories/categoria/categoriaRepository', () => ({
  categoriaRepository: {
    criarCategoria: jest.fn(),
    buscarTodasCategorias: jest.fn(),
  },
}));

describe('CategoriaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarCategoria', () => {
    it('should delegate category creation to repository', async () => {
      const categoria = { id: 'cat-1', descricao: 'Alimentacao' };
      (categoriaRepository.criarCategoria as jest.Mock).mockResolvedValue(categoria);

      const result = await categoriaService.criarCategoria({ descricao: 'Alimentacao' });

      expect(categoriaRepository.criarCategoria).toHaveBeenCalledWith({ descricao: 'Alimentacao' });
      expect(result).toEqual(categoria);
    });

    it('should propagate repository errors during creation', async () => {
      const error = new Error('Falha ao criar categoria');
      (categoriaRepository.criarCategoria as jest.Mock).mockRejectedValue(error);

      await expect(categoriaService.criarCategoria({ descricao: 'Transporte' })).rejects.toThrow(
        'Falha ao criar categoria'
      );
    });
  });

  describe('buscarTodasCategorias', () => {
    it('should return all categories from repository', async () => {
      const categorias = [
        { id: 'cat-1', descricao: 'Alimentacao' },
        { id: 'cat-2', descricao: 'Moradia' },
      ];

      (categoriaRepository.buscarTodasCategorias as jest.Mock).mockResolvedValue(categorias);

      const result = await categoriaService.buscarTodasCategorias();

      expect(categoriaRepository.buscarTodasCategorias).toHaveBeenCalledTimes(1);
      expect(result).toEqual(categorias);
    });

    it('should propagate repository errors when listing categories', async () => {
      const error = new Error('Falha ao listar categorias');
      (categoriaRepository.buscarTodasCategorias as jest.Mock).mockRejectedValue(error);

      await expect(categoriaService.buscarTodasCategorias()).rejects.toThrow(
        'Falha ao listar categorias'
      );
    });
  });
});
