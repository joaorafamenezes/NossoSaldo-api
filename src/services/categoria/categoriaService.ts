import iCriarCategoria from "../../@types/categoria/iCriarCategoria";
import { categoriaRepository } from "../../repositories/categoria/categoriaRepository";
import { CategoriaRepositoryPort } from "../../ports/outbound/categoriaRepositoryPort";

export class CategoriaService {
  constructor(private readonly categoriaRepository: CategoriaRepositoryPort) {}

  async criarCategoria(data: iCriarCategoria) {
    return await this.categoriaRepository.criarCategoria(data);
  }

  async buscarTodasCategorias() {
    return await this.categoriaRepository.buscarTodasCategorias();
  }
}

export const categoriaService = new CategoriaService(categoriaRepository);
