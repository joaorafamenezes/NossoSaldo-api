import { faturaCartaoService } from "./faturaCartaoService";
import { faturaCartaoRepository } from "../../repositories/faturaCartao/faturaCartaoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";

jest.mock("../../repositories/faturaCartao/faturaCartaoRepository", () => ({
  faturaCartaoRepository: {
    listarFaturasPorUsuario: jest.fn(),
    buscarFaturaPorIdParaUsuario: jest.fn(),
    pagarFatura: jest.fn(),
    reabrirFatura: jest.fn(),
  },
}));

jest.mock("../../repositories/usuario/usuarioRepository", () => ({
  usuarioRepository: {
    listarUsuarioPorId: jest.fn(),
  },
}));

describe("FaturaCartaoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("pagarFatura", () => {
    it("should pay the invoice when the user has access", async () => {
      const paymentDate = new Date("2026-05-19T12:00:00.000Z");
      const paidInvoice = {
        id: "fatura-1",
        status: "paga",
        dataPagamento: paymentDate,
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue({
        id: "fatura-1",
        status: "aberta",
      });
      (faturaCartaoRepository.pagarFatura as jest.Mock).mockResolvedValue(paidInvoice);

      await expect(
        faturaCartaoService.pagarFatura("fatura-1", { dataPagamento: paymentDate }, "user-1"),
      ).resolves.toEqual(paidInvoice);

      expect(faturaCartaoRepository.pagarFatura).toHaveBeenCalledWith("fatura-1", paymentDate);
    });

    it("should throw 404 when invoice is not found", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue(null);

      await expect(
        faturaCartaoService.pagarFatura("fatura-404", {}, "user-1"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when invoice is already paid", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue({
        id: "fatura-1",
        status: "paga",
      });

      await expect(
        faturaCartaoService.pagarFatura("fatura-1", {}, "user-1"),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("reabrirFatura", () => {
    it("should reopen the invoice when the user has access", async () => {
      const reopenedInvoice = {
        id: "fatura-1",
        status: "aberta",
        dataPagamento: null,
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue({
        id: "fatura-1",
        status: "paga",
      });
      (faturaCartaoRepository.reabrirFatura as jest.Mock).mockResolvedValue(reopenedInvoice);

      await expect(
        faturaCartaoService.reabrirFatura("fatura-1", "user-1"),
      ).resolves.toEqual(reopenedInvoice);

      expect(faturaCartaoRepository.reabrirFatura).toHaveBeenCalledWith("fatura-1");
    });

    it("should throw 404 when invoice is not found", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue(null);

      await expect(
        faturaCartaoService.reabrirFatura("fatura-404", "user-1"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should throw 400 when invoice is not paid", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue({
        id: "fatura-1",
        status: "aberta",
      });

      await expect(
        faturaCartaoService.reabrirFatura("fatura-1", "user-1"),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
