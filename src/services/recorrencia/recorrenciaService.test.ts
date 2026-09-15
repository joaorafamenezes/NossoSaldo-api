import { recorrenciaService } from "./recorrenciaService";
import { recorrenciaRepository } from "../../repositories/recorrencia/recorrenciaRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { categoriaRepository } from "../../repositories/categoria/categoriaRepository";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";

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

    it("deve lancar 404 se usuario nao for encontrado", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        recorrenciaService.criarRecorrencia(
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
        )
      ).rejects.toMatchObject({ statusCode: 404, message: "Usuario responsavel nao encontrado." });
    });

    it("deve lancar 404 se categoria nao for encontrada", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        recorrenciaService.criarRecorrencia(
          {
            descricao: "Aluguel",
            tipo: "despesa",
            valor: 1500,
            diaVencimento: 5,
            dataInicio: "2026-09-01",
            categoriaId: "cat-invalid",
            responsavelId: "user-1",
          },
          "user-1"
        )
      ).rejects.toMatchObject({ statusCode: 404, message: "Categoria nao encontrada." });
    });

    it("deve lancar 404 se cartaoCreditoId for informado mas nao existir", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue({ id: "cat-1" });
      (cartaoCreditoRepository.buscarCartaoCreditoPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        recorrenciaService.criarRecorrencia(
          {
            descricao: "Streaming",
            tipo: "despesa",
            valor: 50,
            diaVencimento: 10,
            dataInicio: "2026-09-01",
            categoriaId: "cat-1",
            cartaoCreditoId: "cartao-invalido",
            responsavelId: "user-1",
          },
          "user-1"
        )
      ).rejects.toMatchObject({ statusCode: 404, message: "Cartao de credito nao encontrado." });
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

  describe("buscarRecorrenciaPorId", () => {
    it("deve retornar 404 se recorrencia nao existir", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue(null);

      await expect(recorrenciaService.buscarRecorrenciaPorId("rec-none", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("deve retornar a recorrencia se o usuario for o responsavel", async () => {
      const rec = { id: "rec-1", responsavelId: "user-1", descricao: "Internet" };
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue(rec);

      const res = await recorrenciaService.buscarRecorrenciaPorId("rec-1", "user-1");
      expect(res).toEqual(rec);
    });

    it("deve permitir acesso se compartilha conta conjunta e naoCompartilhar for false", async () => {
      const rec = { id: "rec-1", responsavelId: "user-partner", naoCompartilhar: false };
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue(rec);
      (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([
        { usuario1Id: "user-1", usuario2Id: "user-partner" },
      ]);

      const res = await recorrenciaService.buscarRecorrenciaPorId("rec-1", "user-1");
      expect(res).toEqual(rec);
    });

    it("deve lancar 403 se o usuario nao compartilha conta conjunta", async () => {
      const rec = { id: "rec-1", responsavelId: "user-other", naoCompartilhar: false };
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue(rec);
      (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);

      await expect(recorrenciaService.buscarRecorrenciaPorId("rec-1", "user-1")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("listarRecorrenciasPorUsuario", () => {
    it("deve listar recorrencias do usuario", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (recorrenciaRepository.listarRecorrenciasPorUsuario as jest.Mock).mockResolvedValue([{ id: "rec-1" }]);

      const res = await recorrenciaService.listarRecorrenciasPorUsuario("user-1");
      expect(res).toHaveLength(1);
    });

    it("deve lancar 404 se usuario nao existir", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

      await expect(recorrenciaService.listarRecorrenciasPorUsuario("user-invalid")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("atualizarRecorrencia", () => {
    it("deve atualizar recorrencia com sucesso", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
      });
      (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue({ id: "cat-2" });
      (recorrenciaRepository.atualizarRecorrencia as jest.Mock).mockResolvedValue({
        id: "rec-1",
        valor: 2000,
      });

      const res = await recorrenciaService.atualizarRecorrencia(
        "rec-1",
        { valor: 2000, categoriaId: "cat-2", diaVencimento: 10 },
        "user-1"
      );

      expect(res.valor).toBe(2000);
      expect(recorrenciaRepository.atualizarRecorrencia).toHaveBeenCalledWith("rec-1", {
        valor: 2000,
        categoriaId: "cat-2",
        diaVencimento: 10,
      });
    });

    it("deve lancar 404 se nova categoria nao existir", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
      });
      (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        recorrenciaService.atualizarRecorrencia("rec-1", { categoriaId: "cat-none" }, "user-1")
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("deve lancar 400 se diaVencimento for invalido ao atualizar", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
      });

      await expect(
        recorrenciaService.atualizarRecorrencia("rec-1", { diaVencimento: 40 }, "user-1")
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

    it("deve lancar 400 se ja estiver pausada indefinidamente", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
        pausado: true,
      });

      await expect(
        recorrenciaService.pausarRecorrencia("rec-1", {}, "user-1")
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("deve lancar 400 se dataFim for anterior a dataInicio na pausa", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
        pausado: false,
      });

      await expect(
        recorrenciaService.pausarRecorrencia(
          "rec-1",
          { dataPausaInicio: "2026-10-01", dataPausaFim: "2026-09-01" },
          "user-1"
        )
      ).rejects.toMatchObject({ statusCode: 400 });
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

    it("deve lancar 400 ao retomar recorrencia que nao esta pausada", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
        pausado: false,
      });

      await expect(recorrenciaService.retomarRecorrencia("rec-1", "user-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("deletarRecorrencia", () => {
    it("deve deletar recorrencia com sucesso", async () => {
      (recorrenciaRepository.buscarRecorrenciaPorId as jest.Mock).mockResolvedValue({
        id: "rec-1",
        responsavelId: "user-1",
      });
      (recorrenciaRepository.deletarRecorrencia as jest.Mock).mockResolvedValue({ id: "rec-1" });

      const res = await recorrenciaService.deletarRecorrencia("rec-1", "user-1");
      expect(res.message).toContain("sucesso");
      expect(recorrenciaRepository.deletarRecorrencia).toHaveBeenCalledWith("rec-1");
    });
  });
});
