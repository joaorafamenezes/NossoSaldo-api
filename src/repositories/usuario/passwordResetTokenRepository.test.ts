const mockExecuteRaw = jest.fn();
const mockQueryRaw = jest.fn();

jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn(() => ({
      $executeRaw: mockExecuteRaw,
      $queryRaw: mockQueryRaw,
    })),
  };
});

import { passwordResetTokenRepository } from "./passwordResetTokenRepository";

describe("PasswordResetTokenRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should invalidate active tokens by user id", async () => {
    mockExecuteRaw.mockResolvedValue(2);

    await expect(passwordResetTokenRepository.invalidarTokensAtivosPorUsuarioId("user-1")).resolves.toEqual({ count: 2 });
  });

  it("should create a password reset token", async () => {
    const payload = {
      tokenHash: "hash",
      usuarioId: "user-1",
      expiresAt: new Date(),
    };

    mockExecuteRaw.mockResolvedValue(1);

    const result = await passwordResetTokenRepository.criarToken(payload);

    expect(result).toEqual(
      expect.objectContaining({
        tokenHash: "hash",
        usuarioId: "user-1",
        usedAt: null,
      }),
    );
  });

  it("should find a valid token by hash", async () => {
    const tokenRecord = { id: "token-1", tokenHash: "hash", usuarioId: "user-1" };
    mockQueryRaw.mockResolvedValue([tokenRecord]);

    await expect(passwordResetTokenRepository.buscarTokenValidoPorHash("hash")).resolves.toEqual(tokenRecord);
  });

  it("should mark a token as used", async () => {
    mockExecuteRaw.mockResolvedValue(1);

    const result = await passwordResetTokenRepository.marcarTokenComoUsado("token-1");

    expect(result).toEqual(
      expect.objectContaining({
        id: "token-1",
      }),
    );
  });
});
