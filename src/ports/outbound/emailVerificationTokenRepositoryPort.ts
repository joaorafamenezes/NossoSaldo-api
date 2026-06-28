export type CriarEmailVerificationTokenInput = {
  tokenHash: string;
  usuarioId: string;
  expiresAt: Date;
};

export interface EmailVerificationTokenRepositoryPort {
  invalidarTokensAtivosPorUsuarioId(usuarioId: string): Promise<{ count: number }>;
  criarToken(input: CriarEmailVerificationTokenInput): Promise<any>;
  buscarTokenValidoPorHash(tokenHash: string, referencia?: Date): Promise<any>;
  marcarTokenComoUsado(id: string): Promise<{ id: string; usedAt: Date }>;
}
