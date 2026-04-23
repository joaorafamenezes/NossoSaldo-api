import { categoriaRepository } from "../../repositories/categoria/categoriaRepository";
import iCriarCategoria from "../../@types/categoria/iCriarCategoria";

class CategoriaService {
    async criarCategoria(data: iCriarCategoria) {
        return await categoriaRepository.criarCategoria(data);
    }

    async buscarTodasCategorias() {
        return await categoriaRepository.buscarTodasCategorias();
    }
}

export const categoriaService = new CategoriaService();
