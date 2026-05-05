import { contaConjuntaService } from "./contaConjuntaService";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";

jest.mock("../../repositories/usuario/usuarioRepository");
jest.mock("../../repositories/contaConjunta/contaConjuntaRepository");

describe("ContaConjuntaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a conta conjunta when both users exist", async () => {
    const payload = {
      nomeConta: "Casa",
      usuarioConjunto: "user-2",
    };
    const usuarioLogado = "user-1";
    const response = {
      id: "conta-1",
      nomeConta: payload.nomeConta,
      usuario1Id: payload.usuarioConjunto,
      usuario2Id: usuarioLogado,
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuarioConjunto })
      .mockResolvedValueOnce({ id: usuarioLogado });
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);
    (contaConjuntaRepository.listarContaConjuntaPorIds as jest.Mock).mockResolvedValue(null);
    (contaConjuntaRepository.criarContaConjunta as jest.Mock).mockResolvedValue(response);

    await expect(contaConjuntaService.criarContaConjunta(payload, usuarioLogado)).resolves.toEqual(response);
    expect(contaConjuntaRepository.criarContaConjunta).toHaveBeenCalledWith(
      payload.nomeConta,
      payload.usuarioConjunto,
      usuarioLogado,
    );
  });

  it("should throw 404 when one of the users does not exist", async () => {
    const payload = {
      nomeConta: "Casa",
      usuarioConjunto: "user-2",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuarioConjunto })
      .mockResolvedValueOnce(null);
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);

    await expect(contaConjuntaService.criarContaConjunta(payload, "user-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("should throw 409 when conta conjunta already exists for the pair", async () => {
    const payload = {
      nomeConta: "Casa",
      usuarioConjunto: "user-2",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuarioConjunto })
      .mockResolvedValueOnce({ id: "user-1" });
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);
    (contaConjuntaRepository.listarContaConjuntaPorIds as jest.Mock).mockResolvedValue({
      id: "conta-existente",
    });

    await expect(contaConjuntaService.criarContaConjunta(payload, "user-1")).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("should preserve repository errors such as duplicate account conflicts", async () => {
    const payload = {
      nomeConta: "Casa",
      usuarioConjunto: "user-2",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuarioConjunto })
      .mockResolvedValueOnce({ id: "user-1" });
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);
    (contaConjuntaRepository.listarContaConjuntaPorIds as jest.Mock).mockResolvedValue(null);
    (contaConjuntaRepository.criarContaConjunta as jest.Mock).mockRejectedValue({
      statusCode: 409,
      message: "Registro ja existe.",
    });

    await expect(contaConjuntaService.criarContaConjunta(payload, "user-1")).rejects.toMatchObject({
      statusCode: 409,
      message: "Registro ja existe.",
    });
  });

  it("should throw 409 when logged user already has a conta conjunta", async () => {
    const payload = {
      nomeConta: "Casa",
      usuarioConjunto: "user-2",
    };

    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([
      { id: "conta-existente" },
    ]);

    await expect(contaConjuntaService.criarContaConjunta(payload, "user-1")).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("should list contas conjuntas for an existing user", async () => {
    const contas = [{ id: "conta-1" }, { id: "conta-2" }];
    (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue(contas);

    await expect(contaConjuntaService.listarContasConjuntasPorUsuarioId("user-1")).resolves.toEqual(contas);
    expect(contaConjuntaRepository.listarContasConjuntasPorUsuarioId).toHaveBeenCalledWith("user-1");
  });

  it("should throw 404 when listing contas conjuntas for a non-existing user", async () => {
    (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

    await expect(contaConjuntaService.listarContasConjuntasPorUsuarioId("user-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
