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
      nomeConta: "JoÃ£o e NÃ­colas",
      usuario1Id: "a58c7718-c69c-4400-9bf7-9486cea765bc",
      usuario2Id: "cba7f879-75e9-4595-af5d-17dac751596a",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuario1Id })
      .mockResolvedValueOnce({ id: payload.usuario2Id });
    (contaConjuntaRepository.listarContaConjuntaPorIds as jest.Mock).mockResolvedValue(null);
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
      nomeConta: "JoÃ£o e NÃ­colas",
      usuario1Id: "a58c7718-c69c-4400-9bf7-9486cea765bc",
      usuario2Id: "cba7f879-75e9-4595-af5d-17dac751596a",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuario1Id })
      .mockResolvedValueOnce(null);

    await expect(contaConjuntaService.criarContaConjunta(payload)).rejects.toHaveProperty(
      "message",
      "Um ou ambos os usuários não foram encontrados.",
    );
  });

  it("should throw 409 when conta conjunta already exists for the pair", async () => {
    const payload = {
      nomeConta: "JoÃ£o e NÃ­colas",
      usuario1Id: "a58c7718-c69c-4400-9bf7-9486cea765bc",
      usuario2Id: "cba7f879-75e9-4595-af5d-17dac751596a",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuario1Id })
      .mockResolvedValueOnce({ id: payload.usuario2Id });
    (contaConjuntaRepository.listarContaConjuntaPorIds as jest.Mock).mockResolvedValue({
      id: "conta-existente",
    });

    await expect(contaConjuntaService.criarContaConjunta(payload)).rejects.toHaveProperty(
      "message",
      "A conta conjunta já existe para esses usuários.",
    );
  });

  it("should preserve repository errors such as duplicate account conflicts", async () => {
    const payload = {
      nomeConta: "JoÃ£o e NÃ­colas",
      usuario1Id: "a58c7718-c69c-4400-9bf7-9486cea765bc",
      usuario2Id: "cba7f879-75e9-4595-af5d-17dac751596a",
    };

    (usuarioRepository.listarUsuarioPorId as jest.Mock)
      .mockResolvedValueOnce({ id: payload.usuario1Id })
      .mockResolvedValueOnce({ id: payload.usuario2Id });
    (contaConjuntaRepository.listarContaConjuntaPorIds as jest.Mock).mockResolvedValue(null);
    (contaConjuntaRepository.criarContaConjunta as jest.Mock).mockRejectedValue({
      statusCode: 409,
      message: "Registro jÃ¡ existe.",
    });

    await expect(contaConjuntaService.criarContaConjunta(payload)).rejects.toMatchObject({
      statusCode: 409,
      message: "Registro jÃ¡ existe.",
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

    await expect(contaConjuntaService.listarContasConjuntasPorUsuarioId("user-1")).rejects.toHaveProperty(
      "message",
      "Usuário não encontrado.",
    );
  });
});
