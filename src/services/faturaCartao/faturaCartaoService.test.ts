import { faturaCartaoService } from "./faturaCartaoService";
import { faturaCartaoRepository } from "../../repositories/faturaCartao/faturaCartaoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";

jest.mock("../../repositories/faturaCartao/faturaCartaoRepository");
jest.mock("../../repositories/usuario/usuarioRepository");

describe("FaturaCartaoService", () => {
  const usuario = { id: "user-1" };
  const fatura = { id: "invoice-1", status: "aberta" };

  beforeEach(() => {
    jest.clearAllMocks();
    (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(usuario);
  });

  it("should list invoices for existing user", async () => {
    (faturaCartaoRepository.listarFaturasPorUsuario as jest.Mock).mockResolvedValue([fatura]);

    await expect(faturaCartaoService.listarFaturasPorUsuario("user-1", "card-1")).resolves.toEqual([fatura]);
    expect(faturaCartaoRepository.listarFaturasPorUsuario).toHaveBeenCalledWith("user-1", "card-1");
  });

  it("should throw 404 when listing invoices for missing user", async () => {
    (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

    await expect(faturaCartaoService.listarFaturasPorUsuario("user-1")).rejects.toHaveProperty(
      "message",
      "Usuario nao encontrado.",
    );
  });

  it("should pay open invoice", async () => {
    const paymentDate = new Date("2026-08-17T00:00:00.000Z");
    const paidInvoice = { ...fatura, status: "paga", dataPagamento: paymentDate };
    (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue(fatura);
    (faturaCartaoRepository.pagarFatura as jest.Mock).mockResolvedValue(paidInvoice);

    await expect(faturaCartaoService.pagarFatura("invoice-1", { dataPagamento: paymentDate }, "user-1")).resolves.toEqual(paidInvoice);
    expect(faturaCartaoRepository.pagarFatura).toHaveBeenCalledWith("invoice-1", paymentDate);
  });

  it("should throw 404 when invoice does not exist during payment", async () => {
    (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue(null);

    await expect(faturaCartaoService.pagarFatura("invoice-1", {}, "user-1")).rejects.toHaveProperty(
      "message",
      "Fatura do cartao nao encontrada.",
    );
  });

  it("should throw 404 when paying invoice for missing user", async () => {
    (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

    await expect(faturaCartaoService.pagarFatura("invoice-1", {}, "user-1")).rejects.toHaveProperty(
      "message",
      "Usuario nao encontrado.",
    );
  });

  it("should reject already paid invoice", async () => {
    (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue({ ...fatura, status: "paga" });

    await expect(faturaCartaoService.pagarFatura("invoice-1", {}, "user-1")).rejects.toHaveProperty(
      "message",
      "Fatura ja esta paga.",
    );
  });

  it("should reject canceled invoice payment", async () => {
    (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue({ ...fatura, status: "cancelada" });

    await expect(faturaCartaoService.pagarFatura("invoice-1", {}, "user-1")).rejects.toHaveProperty(
      "message",
      "Fatura cancelada nao pode ser paga.",
    );
  });

  it("should reopen paid invoice", async () => {
    const reopenedInvoice = { ...fatura, status: "aberta" };
    (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue({ ...fatura, status: "paga" });
    (faturaCartaoRepository.reabrirFatura as jest.Mock).mockResolvedValue(reopenedInvoice);

    await expect(faturaCartaoService.reabrirFatura("invoice-1", "user-1")).resolves.toEqual(reopenedInvoice);
    expect(faturaCartaoRepository.reabrirFatura).toHaveBeenCalledWith("invoice-1");
  });

  it("should reject reopening invoice that is not paid", async () => {
    (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue(fatura);

    await expect(faturaCartaoService.reabrirFatura("invoice-1", "user-1")).rejects.toHaveProperty(
      "message",
      "Somente faturas pagas podem ser reabertas.",
    );
  });

  it("should throw 404 when reopening invoice for missing user", async () => {
    (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

    await expect(faturaCartaoService.reabrirFatura("invoice-1", "user-1")).rejects.toHaveProperty(
      "message",
      "Usuario nao encontrado.",
    );
  });

  it("should throw 404 when invoice does not exist during reopen", async () => {
    (faturaCartaoRepository.buscarFaturaPorIdParaUsuario as jest.Mock).mockResolvedValue(null);

    await expect(faturaCartaoService.reabrirFatura("invoice-1", "user-1")).rejects.toHaveProperty(
      "message",
      "Fatura do cartao nao encontrada.",
    );
  });
});
