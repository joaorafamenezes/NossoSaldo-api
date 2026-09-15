import iCriarCategoria from "../../@types/categoria/iCriarCategoria";

export interface CategoriaRepositoryPort {
  criarCategoria(categoria: iCriarCategoria): Promise<any>;
  buscarTodasCategorias(): Promise<any[]>;
  buscarCategoriaPorId(id: string): Promise<any | null>;
  atualizarCategoria(id: string, categoria: Partial<iCriarCategoria>): Promise<any>;
  deletarCategoria(id: string): Promise<any>;
}
