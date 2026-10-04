import { ReleaseService } from "./releaseService";

describe("ReleaseService", () => {
  let mockRepository: any;
  let service: ReleaseService;

  beforeEach(() => {
    mockRepository = {
      buscarVersoesVisualizadas: jest.fn(),
      marcarVersaoVisualizada: jest.fn(),
    };
    service = new ReleaseService(mockRepository);
  });

  describe("obterStatusVisualizacao", () => {
    it("CT001: deve retornar hasSeenCurrentVersion = false quando a versao atual nunca foi visualizada pelo usuario", async () => {
      mockRepository.buscarVersoesVisualizadas.mockResolvedValue([
        { id: "view-1", usuarioId: "user-123", versao: "2.0.0", visualizadoEm: new Date() },
      ]);

      const result = await service.obterStatusVisualizacao("user-123", "2.1.0");

      expect(result.hasSeenCurrentVersion).toBe(false);
      expect(result.latestSeenVersion).toBe("2.0.0");
      expect(result.seenVersions).toEqual(["2.0.0"]);
    });

    it("CT002: deve retornar hasSeenCurrentVersion = true quando o usuario ja visualizou a versao atual", async () => {
      mockRepository.buscarVersoesVisualizadas.mockResolvedValue([
        { id: "view-2", usuarioId: "user-123", versao: "2.1.0", visualizadoEm: new Date() },
        { id: "view-1", usuarioId: "user-123", versao: "2.0.0", visualizadoEm: new Date() },
      ]);

      const result = await service.obterStatusVisualizacao("user-123", "2.1.0");

      expect(result.hasSeenCurrentVersion).toBe(true);
      expect(result.latestSeenVersion).toBe("2.1.0");
      expect(result.seenVersions).toEqual(["2.1.0", "2.0.0"]);
    });

    it("deve retornar latestSeenVersion = null quando o usuario nunca visualizou nenhuma versao", async () => {
      mockRepository.buscarVersoesVisualizadas.mockResolvedValue([]);

      const result = await service.obterStatusVisualizacao("user-123", "2.1.0");

      expect(result.hasSeenCurrentVersion).toBe(false);
      expect(result.latestSeenVersion).toBeNull();
      expect(result.seenVersions).toEqual([]);
    });

    it("deve rejeitar com erro se usuarioId nao for informado", async () => {
      await expect(service.obterStatusVisualizacao("")).rejects.toThrow(
        "Identificador de usuário é obrigatório."
      );
    });
  });

  describe("marcarComoVisualizada", () => {
    it("deve registrar a versao visualizada com sucesso e retornar confirmacao", async () => {
      const dataCriacao = new Date();
      mockRepository.marcarVersaoVisualizada.mockResolvedValue({
        id: "view-new",
        usuarioId: "user-123",
        versao: "2.1.0",
        visualizadoEm: dataCriacao,
      });

      const result = await service.marcarComoVisualizada("user-123", "2.1.0");

      expect(mockRepository.marcarVersaoVisualizada).toHaveBeenCalledWith("user-123", "2.1.0");
      expect(result.success).toBe(true);
      expect(result.versao).toBe("2.1.0");
      expect(result.visualizadoEm).toBe(dataCriacao);
    });

    it("deve rejeitar se versao estiver vazia", async () => {
      await expect(service.marcarComoVisualizada("user-123", "")).rejects.toThrow(
        "A versão da release é obrigatória."
      );
    });
  });
});
