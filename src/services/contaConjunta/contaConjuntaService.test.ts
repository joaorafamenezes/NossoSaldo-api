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
      nomeConta: "João e Nícolas",
      usuario1Id: "a58c7718-c69c-4400-9bf7-9486cea765bc",
      usuario2Id: "cba7f879-75e9-4595-af5d-17dac751596a",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuario1Id })
      .mockResolvedValueOnce({ id: payload.usuario2Id });
    (contaConjuntaRepository.criarContaConjunta as jest.Mock).mockResolvedValue({
      id: "uuid-da-conta",
      ...payload,
    });

    await expect(contaConjuntaService.criarContaConjunta(payload)).resolves.toEqual({
      id: "uuid-da-conta",
      ...payload,
    });
  });

  it("should throw 404 when one of the users does not exist", async () => {
    const payload = {
      nomeConta: "João e Nícolas",
      usuario1Id: "a58c7718-c69c-4400-9bf7-9486cea765bc",
      usuario2Id: "cba7f879-75e9-4595-af5d-17dac751596a",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuario1Id })
      .mockResolvedValueOnce(null);

    await expect(contaConjuntaService.criarContaConjunta(payload)).rejects.toMatchObject({
      statusCode: 404,
      message: "Um ou ambos os usuários não foram encontrados.",
    });
  });

  it("should preserve repository errors such as duplicate account conflicts", async () => {
    const payload = {
      nomeConta: "João e Nícolas",
      usuario1Id: "a58c7718-c69c-4400-9bf7-9486cea765bc",
      usuario2Id: "cba7f879-75e9-4595-af5d-17dac751596a",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuario1Id })
      .mockResolvedValueOnce({ id: payload.usuario2Id });
    (contaConjuntaRepository.criarContaConjunta as jest.Mock).mockRejectedValue({
      statusCode: 409,
      message: "Registro já existe.",
    });

    await expect(contaConjuntaService.criarContaConjunta(payload)).rejects.toMatchObject({
      statusCode: 409,
      message: "Registro já existe.",
    });
  });
});
