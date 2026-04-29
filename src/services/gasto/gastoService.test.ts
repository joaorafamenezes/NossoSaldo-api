import { gastoService } from "./gastoService";
import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";

jest.mock("../../repositories/gasto/gastoRepository", () => ({
  gastoRepository: {
    buscarGastoPorId: jest.fn(),
    buscarTotalGastoMesAtualPorResponsavelId: jest.fn(),
    atualizarGasto: jest.fn(),
    deletarGasto: jest.fn(),
    criarGastoUsuarioLogado: jest.fn(),
    listarGastosPorResponsavelId: jest.fn(),
    pagarGasto: jest.fn(),
  },
}));

jest.mock("../../repositories/usuario/usuarioRepository", () => ({
  usuarioRepository: {
    listarUsuarioPorId: jest.fn(),
  },
}));

describe("GastoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("criarGastoUsuarioLogado", () => {
    it("should create gasto when responsible user exists", async () => {
      const payload = {
        descricao: "Mercado",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "unico",
        valor: 100,
        categoriaId: "cat-1",
        responsavelId: "user-1",
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (gastoRepository.criarGastoUsuarioLogado as jest.Mock).mockResolvedValue({ id: "gasto-1", ...payload });

      await expect(gastoService.criarGastoUsuarioLogado(payload as any)).resolves.toEqual({
        id: "gasto-1",
        ...payload,
      });
    });

    it("should throw 404 when responsible user does not exist during create", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.criarGastoUsuarioLogado({ responsavelId: "user-1" } as any)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("listarGastosPorResponsavelId", () => {
    it("should list gastos when user exists", async () => {
      const gastos = [{ id: "gasto-1" }];
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (gastoRepository.listarGastosPorResponsavelId as jest.Mock).mockResolvedValue(gastos);

      await expect(gastoService.listarGastosPorResponsavelId("user-1")).resolves.toEqual(gastos);
    });

    it("should throw 404 when user does not exist during list", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.listarGastosPorResponsavelId("user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("buscarTotalGastoMesAtualPorResponsavelId", () => {
    it("should return the current month total for the logged user", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (gastoRepository.buscarTotalGastoMesAtualPorResponsavelId as jest.Mock).mockResolvedValue(450.9);

      const result = await gastoService.buscarTotalGastoMesAtualPorResponsavelId("user-1");

      expect(usuarioRepository.listarUsuarioPorId).toHaveBeenCalledWith("user-1");
      expect(gastoRepository.buscarTotalGastoMesAtualPorResponsavelId).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        referencia: expect.stringMatching(/^\d{4}-\d{2}$/),
        totalGastoMesAtual: 450.9,
      });
    });

    it("should throw 404 when user is not found before calculating current month total", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.buscarTotalGastoMesAtualPorResponsavelId("user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("detalharGastoPorId", () => {
    it("should return gasto details when it belongs to the user", async () => {
      const gasto = { id: "gasto-1", responsavelId: "user-1" };
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(gasto);

      await expect(gastoService.detalharGastoPorId("gasto-1", "user-1")).resolves.toEqual(gasto);
    });

    it("should throw 404 when gasto is not found during detail", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.detalharGastoPorId("gasto-1", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 403 when gasto belongs to another user during detail", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-2",
      });

      await expect(gastoService.detalharGastoPorId("gasto-1", "user-1")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("atualizarGasto", () => {
    it("should update the gasto when it belongs to the user", async () => {
      const gasto = { id: "gasto-1", responsavelId: "user-1" };
      const payload = { descricao: "Aluguel atualizado", valor: 1800 };

      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(gasto);
      (gastoRepository.atualizarGasto as jest.Mock).mockResolvedValue({
        ...gasto,
        ...payload,
      });

      await expect(gastoService.atualizarGasto("gasto-1", payload, "user-1")).resolves.toEqual({
        ...gasto,
        ...payload,
      });

      expect(gastoRepository.atualizarGasto).toHaveBeenCalledWith("gasto-1", payload);
    });

    it("should throw 404 when gasto does not exist during update", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.atualizarGasto("gasto-inexistente", { descricao: "Novo nome" }, "user-1")).rejects.toHaveProperty(
        "message",
        "Gasto nÃ£o encontrado.",
      );
    });

    it("should throw 403 when gasto belongs to another user during update", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-2",
      });

      await expect(gastoService.atualizarGasto("gasto-1", { descricao: "Novo nome" }, "user-1")).rejects.toHaveProperty(
        "message",
        "UsuÃ¡rio nÃ£o autorizado a atualizar este gasto.",
      );
    });
  });

  describe("pagarGasto", () => {
    it("should pay gasto when it belongs to the user and is pending", async () => {
      const gasto = { id: "gasto-1", responsavelId: "user-1", status: "pendente" };
      const data = { dataPagamento: new Date("2026-04-29T12:00:00.000Z") };
      const gastoPago = { ...gasto, status: "pago" };

      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(gasto);
      (gastoRepository.pagarGasto as jest.Mock).mockResolvedValue(gastoPago);

      await expect(gastoService.pagarGasto("gasto-1", data as any, "user-1")).resolves.toEqual(gastoPago);
      expect(gastoRepository.pagarGasto).toHaveBeenCalledWith("gasto-1", data.dataPagamento);
    });

    it("should throw 404 when gasto does not exist during payment", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.pagarGasto("gasto-1", {} as any, "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 400 when gasto is already paid", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-1",
        status: "pago",
      });

      await expect(gastoService.pagarGasto("gasto-1", {} as any, "user-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 403 when gasto belongs to another user during payment", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-2",
        status: "pendente",
      });

      await expect(gastoService.pagarGasto("gasto-1", {} as any, "user-1")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("deletarGasto", () => {
    it("should soft delete the gasto when it belongs to the user", async () => {
      const gasto = { id: "gasto-1", responsavelId: "user-1" };

      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(gasto);
      (gastoRepository.deletarGasto as jest.Mock).mockResolvedValue({
        ...gasto,
        deletedAt: new Date("2026-04-29T12:00:00.000Z"),
      });

      await expect(gastoService.deletarGasto("gasto-1", "user-1")).resolves.toEqual({
        message: "Gasto marcado como excluÃƒÂ­do com sucesso.",
      });

      expect(gastoRepository.deletarGasto).toHaveBeenCalledWith("gasto-1");
    });

    it("should throw 404 when gasto does not exist", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.deletarGasto("gasto-inexistente", "user-1")).rejects.toHaveProperty(
        "message",
        "Gasto nÃƒÂ£o encontrado.",
      );
    });

    it("should throw 403 when gasto belongs to another user", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-2",
      });

      await expect(gastoService.deletarGasto("gasto-1", "user-1")).rejects.toHaveProperty(
        "message",
        "UsuÃƒÂ¡rio nÃƒÂ£o autorizado a excluir este gasto.",
      );
    });
  });
});
