export type CriarUsuarioRepositoryInput = {
  nome: string;
  email: string;
  senha: string;
};

export interface UsuarioRepositoryPort {
  buscarUsuarioPorEmail(email: string): Promise<any>;
  criarUsuario(usuario: CriarUsuarioRepositoryInput): Promise<any>;
  listarUsuarios(): Promise<any[]>;
  listarUsuarioPorId(id: string): Promise<any>;
  atualizaUsuario(id: string, dadosAtualizados: Partial<CriarUsuarioRepositoryInput>): Promise<any>;
  atualizaSenhaUsuario(id: string, novaSenha: string): Promise<any>;
  buscarSenhaUsuario(id: string): Promise<string>;
  marcarEmailComoVerificado(id: string): Promise<any>;
}
