export type IaConversaPersistida = {
  id: string;
  usuarioId: string;
  pergunta: string;
  resposta: string;
  provedor: string;
  modelo: string;
  createdAt: Date;
};

export type NovaIaConversa = Omit<IaConversaPersistida, "id" | "createdAt">;

export interface IaConversaRepositoryPort {
  criar(conversa: NovaIaConversa): Promise<IaConversaPersistida>;
  listarPorUsuarioId(usuarioId: string, limite: number): Promise<IaConversaPersistida[]>;
  removerPorUsuarioId(usuarioId: string): Promise<void>;
}
