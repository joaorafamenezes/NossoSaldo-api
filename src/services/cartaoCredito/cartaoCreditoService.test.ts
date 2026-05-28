import { cartaoCreditoService } from "./cartaoCreditoService";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";

jest.mock("../../repositories/cartaoCredito/cartaoCreditoRepository");

describe("CartaoCreditoService", () => {
  const cartao = {
    id: "card-1",
    usuarioId: "user-1",
    descricao: "Nubank",
    diaFechamento: 10,
    diaVencimento: 17,
    valorLimite: 5000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a credit card", async () => {
    (cartaoCreditoRepository.criarCartaoCredito as jest.Mock).mockResolvedValue(cartao);

    await expect(cartaoCreditoService.criarCartaoCredito("user-1", cartao)).resolves.toEqual(cartao);
    expect(cartaoCreditoRepository.criarCartaoCredito).toHaveBeenCalledWith("user-1", cartao);
  });

  it("should list credit cards by user", async () => {
    (cartaoCreditoRepository.listarCartoesCreditoPorUsuario as jest.Mock).mockResolvedValue([cartao]);

    await expect(cartaoCreditoService.listarCartoesCreditoPorUsuario("user-1")).resolves.toEqual([cartao]);
    expect(cartaoCreditoRepository.listarCartoesCreditoPorUsuario).toHaveBeenCalledWith("user-1");
  });

  it("should get credit card by id", async () => {
    (cartaoCreditoRepository.buscarCartaoCreditoPorId as jest.Mock).mockResolvedValue(cartao);

    await expect(cartaoCreditoService.buscarCartaoCreditoPorId("card-1")).resolves.toEqual(cartao);
    expect(cartaoCreditoRepository.buscarCartaoCreditoPorId).toHaveBeenCalledWith("card-1");
  });

  it("should update credit card owned by user", async () => {
    const atualizado = { ...cartao, descricao: "Inter" };
    (cartaoCreditoRepository.buscarCartaoCreditoPorId as jest.Mock).mockResolvedValue(cartao);
    (cartaoCreditoRepository.atualizarCartaoCredito as jest.Mock).mockResolvedValue(atualizado);

    await expect(cartaoCreditoService.atualizarCartaoCredito("card-1", "user-1", atualizado)).resolves.toEqual(atualizado);
    expect(cartaoCreditoRepository.atualizarCartaoCredito).toHaveBeenCalledWith("card-1", atualizado);
  });

  it("should throw 404 when credit card does not exist", async () => {
    (cartaoCreditoRepository.buscarCartaoCreditoPorId as jest.Mock).mockResolvedValue(null);

    await expect(cartaoCreditoService.atualizarCartaoCredito("card-1", "user-1", cartao)).rejects.toHaveProperty(
      "message",
      "Cartao de credito nao encontrado.",
    );
  });

  it("should throw 403 when credit card belongs to another user", async () => {
    (cartaoCreditoRepository.buscarCartaoCreditoPorId as jest.Mock).mockResolvedValue({
      ...cartao,
      usuarioId: "other-user",
    });

    await expect(cartaoCreditoService.atualizarCartaoCredito("card-1", "user-1", cartao)).rejects.toHaveProperty(
      "message",
      "Usuario nao autorizado a atualizar este cartao de credito.",
    );
  });
});
