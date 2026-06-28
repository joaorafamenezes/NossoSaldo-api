export interface ContaConjuntaRepositoryPort {
  criarContaConjunta(nomeConta: string, usuarioConjuntoValidado: string, usuarioLogadoValidado: string): Promise<any>;
  listarContaConjuntaPorIds(usuario1Id: string, usuario2Id: string): Promise<any>;
  listarContasConjuntasPorUsuarioId(usuarioId: string): Promise<any[]>;
  buscarContaConjuntaPorId(id: string): Promise<any>;
  desvincularContaConjunta(id: string): Promise<any>;
}
