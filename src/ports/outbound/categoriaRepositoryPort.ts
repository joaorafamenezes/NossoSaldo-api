import iCriarCategoria from "../../@types/categoria/iCriarCategoria";

export interface CategoriaRepositoryPort {
  criarCategoria(categoria: iCriarCategoria): Promise<any>;
  buscarTodasCategorias(): Promise<any[]>;
}
