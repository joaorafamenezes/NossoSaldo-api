export type CriarPasswordResetTokenInput = {
  tokenHash: string;
  usuarioId: string;
  expiresAt: Date;
};

export interface PasswordResetTokenRepositoryPort {
  invalidarTokensAtivosPorUsuarioId(usuarioId: string): Promise<{ count: number }>;
  criarToken(input: CriarPasswordResetTokenInput): Promise<any>;
  buscarTokenValidoPorHash(tokenHash: string, referencia?: Date): Promise<any>;
  marcarTokenComoUsado(id: string): Promise<{ id: string; usedAt: Date }>;
}
