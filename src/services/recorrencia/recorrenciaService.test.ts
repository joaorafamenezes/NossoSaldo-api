import { recorrenciaService } from "./recorrenciaService";
import { recorrenciaRepository } from "../../repositories/recorrencia/recorrenciaRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { categoriaRepository } from "../../repositories/categoria/categoriaRepository";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";

jest.mock("../../repositories/recorrencia/recorrenciaRepository");
jest.mock("../../repositories/usuario/usuarioRepository");
jest.mock("../../repositories/categoria/categoriaRepository");
jest.mock("../../repositories/cartaoCredito/cartaoCreditoRepository");
jest.mock("../../repositories/contaConjunta/contaConjuntaRepository");

describe("RecorrenciaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("criarRecorrencia", () => {
    it("deve criar uma regra de recorrencia com sucesso", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1", nome: "User" });
      (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue({ id: "cat-1", descricao: "Moradia" });
      (recorrenciaRepository.criarRecorrencia as jest.Mock).mockResolvedValue({
        id: "rec-1",
        descricao: "Aluguel",
        valor: 1500,
        diaVencimento: 5,
        responsavelId: "user-1",
      });

      const resultado = await recorrenciaService.criarRecorrencia(
        {
          descricao: "Aluguel",
          tipo: "despesa",
          valor: 1500,
          diaVencimento: 5,
          dataInicio: "2026-09-01",
          categoriaId: "cat-1",
          responsavelId: "user-1",
        },
        "user-1"
      );

      expect(resultado).toBeDefined();
      expect(resultado.descricao).toBe("Aluguel");
      expect(recorrenciaRepository.criarRecorrencia).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: "Aluguel",
          responsavelId: "user-1",
          diaVencimento: 5,
        })
      );
    });

    it("deve lancar 400 se diaVencimento for invalido", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue({ id: "cat-1" });

      await expect(
        recorrenciaService.criarRecorrencia(
          {
            descricao: "Aluguel",
            tipo: "despesa",
            valor: 1500,
            diaVencimento: 35, // Invalido
            dataInicio: "2026-09-01",
            categoriaId: "cat-1",
            responsavelId: "user-1",
          },
          "user-1"
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("pausarRecorrencia e retomarRecorrencia", () => {
    it("deve pausar uma recorrencia ativa", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
        pausado: false,
      });
      (recorrenciaRepository.pausarRecorrencia as jest.Mock).mockResolvedValue({
        id: "rec-1",
        pausado: true,
        motivoPausa: "Ferias",
      });

      const resultado = await recorrenciaService.pausarRecorrencia(
        "rec-1",
        { motivoPausa: "Ferias" },
        "user-1"
      );

      expect(resultado.pausado).toBe(true);
      expect(recorrenciaRepository.pausarRecorrencia).toHaveBeenCalledWith("rec-1", { motivoPausa: "Ferias" });
    });

    it("deve retomar uma recorrencia pausada", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
        pausado: true,
      });
      (recorrenciaRepository.retomarRecorrencia as jest.Mock).mockResolvedValue({
        id: "rec-1",
        pausado: false,
      });

      const resultado = await recorrenciaService.retomarRecorrencia("rec-1", "user-1");

      expect(resultado.pausado).toBe(false);
      expect(recorrenciaRepository.retomarRecorrencia).toHaveBeenCalledWith("rec-1");
    });
  });
});
