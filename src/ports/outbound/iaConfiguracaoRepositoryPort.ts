export type IaConfiguracaoPersistida = {
  usuarioId: string;
  provedor: string;
  modelo: string;
  chaveCriptografada: string;
  iv: string;
  authTag: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface IaConfiguracaoRepositoryPort {
  salvar(configuracao: Omit<IaConfiguracaoPersistida, "createdAt" | "updatedAt">): Promise<IaConfiguracaoPersistida>;
  buscarPorUsuarioId(usuarioId: string): Promise<IaConfiguracaoPersistida | null>;
  buscarConfiguracaoAtiva(usuarioId?: string): Promise<IaConfiguracaoPersistida | null>;
  removerPorUsuarioId(usuarioId: string): Promise<void>;
}
