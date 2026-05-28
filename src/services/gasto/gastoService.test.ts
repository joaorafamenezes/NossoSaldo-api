import { gastoService } from "./gastoService";
import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";
import { faturaCartaoRepository } from "../../repositories/faturaCartao/faturaCartaoRepository";

jest.mock("../../repositories/gasto/gastoRepository", () => ({
  gastoRepository: {
    buscarGastoPorId: jest.fn(),
    buscarTotalGastoMesAtualPorResponsavelId: jest.fn(),
    atualizarGasto: jest.fn(),
    deletarGasto: jest.fn(),
    criarGastoUsuarioLogado: jest.fn(),
    listarGastosPorResponsavelId: jest.fn(),
    listarModelosRecorrentesAtivosPorResponsaveis: jest.fn(),
    listarGastosDaSerieRecorrente: jest.fn(),
    buscarGastoGeradoPorRecorrencia: jest.fn(),
    calcularDataVencimentoRecorrente: jest.fn(),
    pagarGasto: jest.fn(),
    reabrirGasto: jest.fn(),
    buscarLancamentoBasePorId: jest.fn(),
    pagarLancamentoBase: jest.fn(),
    listarLancamentosBasePorGastoId: jest.fn(),
    vincularLancamentoBaseAFatura: jest.fn(),
  },
}));

jest.mock("../../repositories/usuario/usuarioRepository", () => ({
  usuarioRepository: {
    listarUsuarioPorId: jest.fn(),
  },
}));

jest.mock("../../repositories/contaConjunta/contaConjuntaRepository", () => ({
  contaConjuntaRepository: {
    listarContasConjuntasPorUsuarioId: jest.fn(),
  },
}));

jest.mock("../../repositories/cartaoCredito/cartaoCreditoRepository", () => ({
  cartaoCreditoRepository: {
    buscarCartaoCreditoPorId: jest.fn(),
  },
}));

jest.mock("../../repositories/faturaCartao/faturaCartaoRepository", () => ({
  faturaCartaoRepository: {
    buscarOuCriarFatura: jest.fn(),
    buscarOuCriarFaturaPorCompetencia: jest.fn(),
    recalcularValorTotal: jest.fn(),
  },
}));

describe("GastoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);
    (gastoRepository.listarModelosRecorrentesAtivosPorResponsaveis as jest.Mock).mockResolvedValue([]);
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
        descricao: "Mercado",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "unico",
        valor: 100,
        categoriaId: "cat-1",
        responsavelId: "user-1",
      });

      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenCalledWith(
        expect.objectContaining({ cartaoCreditoId: null }),
      );
    });

    it("should throw 404 when responsible user does not exist during create", async () => {
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.criarGastoUsuarioLogado({ responsavelId: "user-1" } as any)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should create or reuse the invoice for the due month when the expense uses a credit card", async () => {
      const dueDate = new Date("2026-05-10T00:00:00.000Z");
      const payload = {
        descricao: "Compra no cartao",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "unico",
        valor: 100,
        categoriaId: "cat-1",
        responsavelId: "user-1",
        cartaoCreditoId: "card-1",
        dataVencimento: dueDate,
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (cartaoCreditoRepository.buscarCartaoCreditoPorId as jest.Mock).mockResolvedValue({
        id: "card-1",
        usuarioId: "user-1",
        diaFechamento: 5,
        diaVencimento: 10,
      });
      (faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia as jest.Mock).mockResolvedValue({ id: "fatura-maio" });
      (gastoRepository.criarGastoUsuarioLogado as jest.Mock).mockResolvedValue({ id: "gasto-1", ...payload, faturaCartaoId: "fatura-maio" });

      await expect(gastoService.criarGastoUsuarioLogado(payload as any)).resolves.toEqual({
        id: "gasto-1",
        ...payload,
        faturaCartaoId: "fatura-maio",
      });

      expect(faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia).toHaveBeenCalledWith(
        expect.objectContaining({ id: "card-1" }),
        dueDate,
      );
      expect(faturaCartaoRepository.buscarOuCriarFatura).not.toHaveBeenCalled();
      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenCalledWith(
        expect.objectContaining({ faturaCartaoId: "fatura-maio" }),
      );
    });

    it("should use the due date as recurrence start date when creating a recurring expense model", async () => {
      const dueDate = new Date("2026-05-10T00:00:00.000Z");
      const payload = {
        descricao: "Netflix",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "recorrente",
        valor: 39.9,
        categoriaId: "cat-1",
        responsavelId: "user-1",
        dataVencimento: dueDate,
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (gastoRepository.criarGastoUsuarioLogado as jest.Mock).mockResolvedValue({
        id: "gasto-recorrente",
        ...payload,
        dataInicioRecorrencia: dueDate,
      });

      await gastoService.criarGastoUsuarioLogado(payload as any);

      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenCalledWith(
        expect.objectContaining({
          dataInicioRecorrencia: dueDate,
        }),
      );
    });

    it("should create future recurring records up to the informed end date", async () => {
      const dueDate = new Date(2026, 4, 10);
      const endDate = new Date(2026, 6, 10);
      const payload = {
        descricao: "Prime Video",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "recorrente",
        valor: 19.9,
        categoriaId: "cat-1",
        responsavelId: "user-1",
        dataVencimento: dueDate,
        dataFimRecorrencia: endDate,
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (gastoRepository.criarGastoUsuarioLogado as jest.Mock)
        .mockResolvedValueOnce({
          id: "gasto-recorrente",
          ...payload,
          competencia: new Date(2026, 4, 1),
          recorrenciaPaiId: "gasto-recorrente",
          dataInicioRecorrencia: dueDate,
        })
        .mockResolvedValueOnce({ id: "gasto-junho" })
        .mockResolvedValueOnce({ id: "gasto-julho" });
      (gastoRepository.listarGastosDaSerieRecorrente as jest.Mock).mockResolvedValue([
        {
          id: "gasto-recorrente",
          ...payload,
          competencia: new Date(2026, 4, 1),
          recorrenciaPaiId: "gasto-recorrente",
          dataInicioRecorrencia: dueDate,
          dataFimRecorrencia: endDate,
        },
      ]);
      (gastoRepository.calcularDataVencimentoRecorrente as jest.Mock)
        .mockReturnValueOnce(new Date(2026, 4, 10))
        .mockReturnValueOnce(new Date(2026, 5, 10))
        .mockReturnValueOnce(new Date(2026, 6, 10));

      await gastoService.criarGastoUsuarioLogado(payload as any);

      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenCalledTimes(3);
      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          recorrenciaPaiId: "gasto-recorrente",
          competencia: new Date(2026, 5, 1),
          dataVencimento: new Date(2026, 5, 10),
        }),
      );
      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          recorrenciaPaiId: "gasto-recorrente",
          competencia: new Date(2026, 6, 1),
          dataVencimento: new Date(2026, 6, 10),
        }),
      );
    });

    it("should link installment invoices by the due month of each installment", async () => {
      const payload = {
        descricao: "Compra parcelada",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "parcelado",
        numeroParcelas: 2,
        valor: 200,
        categoriaId: "cat-1",
        responsavelId: "user-1",
        cartaoCreditoId: "card-1",
        dataVencimento: new Date("2026-05-19T00:00:00.000Z"),
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (cartaoCreditoRepository.buscarCartaoCreditoPorId as jest.Mock).mockResolvedValue({
        id: "card-1",
        usuarioId: "user-1",
        diaFechamento: 10,
        diaVencimento: 17,
      });
      (gastoRepository.criarGastoUsuarioLogado as jest.Mock).mockResolvedValue({ id: "gasto-parcelado", ...payload });
      (gastoRepository.listarLancamentosBasePorGastoId as jest.Mock).mockResolvedValue([
        { id: "parcela-1", dataVencimentoParcela: new Date("2026-05-19T00:00:00.000Z") },
        { id: "parcela-2", dataVencimentoParcela: new Date("2026-06-19T00:00:00.000Z") },
      ]);
      (faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia as jest.Mock)
        .mockResolvedValueOnce({ id: "fatura-2026-05" })
        .mockResolvedValueOnce({ id: "fatura-2026-06" });

      await gastoService.criarGastoUsuarioLogado(payload as any);

      expect(faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: "card-1" }),
        new Date("2026-05-19T00:00:00.000Z"),
      );
      expect(faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: "card-1" }),
        new Date("2026-06-19T00:00:00.000Z"),
      );
      expect(gastoRepository.vincularLancamentoBaseAFatura).toHaveBeenCalledWith("parcela-1", "fatura-2026-05");
      expect(gastoRepository.vincularLancamentoBaseAFatura).toHaveBeenCalledWith("parcela-2", "fatura-2026-06");
    });
  });

  describe("listarGastosPorResponsavelId", () => {
    it("should list gastos when user exists", async () => {
      const gastos = [{ id: "gasto-1" }];
      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (gastoRepository.listarGastosPorResponsavelId as jest.Mock).mockResolvedValue(gastos);

      await expect(gastoService.listarGastosPorResponsavelId("user-1")).resolves.toEqual(gastos);
      expect(gastoRepository.listarModelosRecorrentesAtivosPorResponsaveis).toHaveBeenCalledTimes(1);
    });

    it("should generate the current month expense from an active recurring model before listing", async () => {
      const gastos = [{ id: "gasto-gerado" }];
      const modelo = {
        id: "modelo-netflix",
        descricao: "Netflix",
        tipo: "despesa",
        valor: 39.9,
        categoriaId: "cat-1",
        responsavelId: "user-1",
        cartaoCreditoId: null,
        naoCompartilhar: false,
        dataVencimento: new Date("2026-01-10T00:00:00.000Z"),
        dataInicioRecorrencia: new Date("2026-01-10T00:00:00.000Z"),
        observacao: null,
      };

      (usuarioRepository.listarUsuarioPorId as jest.Mock).mockResolvedValue({ id: "user-1" });
      (gastoRepository.listarModelosRecorrentesAtivosPorResponsaveis as jest.Mock).mockResolvedValue([modelo]);
      (gastoRepository.buscarGastoGeradoPorRecorrencia as jest.Mock).mockResolvedValue(null);
      (gastoRepository.calcularDataVencimentoRecorrente as jest.Mock).mockReturnValue(new Date("2026-05-10T00:00:00.000Z"));
      (gastoRepository.criarGastoUsuarioLogado as jest.Mock).mockResolvedValue({ id: "gasto-gerado" });
      (gastoRepository.listarGastosPorResponsavelId as jest.Mock).mockResolvedValue(gastos);

      await expect(gastoService.listarGastosPorResponsavelId("user-1")).resolves.toEqual(gastos);

      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: "Netflix",
          origemLancamento: "recorrente",
          recorrenciaPaiId: "modelo-netflix",
          responsavelId: "user-1",
          status: "pendente",
        }),
      );
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

    it("should return shared gasto details when user belongs to the joint account", async () => {
      const gasto = {
        id: "gasto-1",
        responsavelId: "user-2",
        naoCompartilhar: false,
      };

      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(gasto);
      (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([
        { id: "conta-1", usuario1Id: "user-1", usuario2Id: "user-2" },
      ]);

      await expect(gastoService.detalharGastoPorId("gasto-1", "user-1")).resolves.toEqual(gasto);
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

    it("should update future recurring records when a recurring expense is edited", async () => {
      const recurringExpense = {
        id: "gasto-junho",
        descricao: "Paramount Plus",
        tipo: "despesa",
        status: "pendente",
        origemLancamento: "recorrente",
        valor: 18.9,
        categoriaId: "cat-1",
        responsavelId: "user-1",
        competencia: new Date(2026, 5, 1),
        dataVencimento: new Date(2026, 5, 10),
        observacao: null,
        cartaoCreditoId: null,
        recorrenciaPaiId: "gasto-maio",
        dataInicioRecorrencia: new Date(2026, 4, 10),
        dataFimRecorrencia: new Date(2026, 7, 10),
        naoCompartilhar: false,
      };
      const rootExpense = {
        ...recurringExpense,
        id: "gasto-maio",
        competencia: new Date(2026, 4, 1),
        recorrenciaPaiId: "gasto-maio",
      };
      const julyExpense = {
        ...recurringExpense,
        id: "gasto-julho",
        competencia: new Date(2026, 6, 1),
        dataVencimento: new Date(2026, 6, 10),
      };
      const augustExpense = {
        ...recurringExpense,
        id: "gasto-agosto",
        competencia: new Date(2026, 7, 1),
        dataVencimento: new Date(2026, 7, 10),
      };
      const payload = {
        descricao: "Paramount+",
        valor: 21.9,
        dataVencimento: new Date(2026, 5, 15),
        dataFimRecorrencia: new Date(2026, 8, 15),
      };

      (gastoRepository.buscarGastoPorId as jest.Mock)
        .mockResolvedValueOnce(recurringExpense)
        .mockResolvedValueOnce(rootExpense)
        .mockResolvedValueOnce({ ...recurringExpense, ...payload });
      (gastoRepository.listarGastosDaSerieRecorrente as jest.Mock).mockResolvedValue([
        rootExpense,
        recurringExpense,
        julyExpense,
        augustExpense,
      ]);
      (gastoRepository.calcularDataVencimentoRecorrente as jest.Mock)
        .mockReturnValueOnce(new Date(2026, 5, 15))
        .mockReturnValueOnce(new Date(2026, 6, 15))
        .mockReturnValueOnce(new Date(2026, 7, 15))
        .mockReturnValueOnce(new Date(2026, 8, 15));
      (gastoRepository.criarGastoUsuarioLogado as jest.Mock).mockResolvedValue({ id: "gasto-setembro" });

      await gastoService.atualizarGasto("gasto-junho", payload as any, "user-1");

      expect(gastoRepository.atualizarGasto).toHaveBeenCalledWith(
        "gasto-junho",
        expect.objectContaining({
          descricao: "Paramount+",
          valor: 21.9,
          dataVencimento: new Date(2026, 5, 15),
        }),
      );
      expect(gastoRepository.atualizarGasto).toHaveBeenCalledWith(
        "gasto-julho",
        expect.objectContaining({
          descricao: "Paramount+",
          valor: 21.9,
          dataVencimento: new Date(2026, 6, 15),
        }),
      );
      expect(gastoRepository.criarGastoUsuarioLogado).toHaveBeenCalledWith(
        expect.objectContaining({
          recorrenciaPaiId: "gasto-maio",
          competencia: new Date(2026, 8, 1),
          dataVencimento: new Date(2026, 8, 15),
        }),
      );
    });

    it("should throw 404 when gasto does not exist during update", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.atualizarGasto("gasto-inexistente", { descricao: "Novo nome" }, "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 403 when gasto belongs to another user during update", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-2",
      });

      await expect(gastoService.atualizarGasto("gasto-1", { descricao: "Novo nome" }, "user-1")).rejects.toMatchObject({
        statusCode: 403,
      });
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

  describe("reabrirGasto", () => {
    it("should reopen gasto when it belongs to the user and is paid", async () => {
      const gasto = { id: "gasto-1", responsavelId: "user-1", status: "pago", cartaoCreditoId: null };
      const gastoReaberto = { ...gasto, status: "pendente", dataPagamento: null };

      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(gasto);
      (gastoRepository.reabrirGasto as jest.Mock).mockResolvedValue(gastoReaberto);

      await expect(gastoService.reabrirGasto("gasto-1", "user-1")).resolves.toEqual(gastoReaberto);
      expect(gastoRepository.reabrirGasto).toHaveBeenCalledWith("gasto-1");
    });

    it("should throw 404 when gasto does not exist during reopen", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.reabrirGasto("gasto-1", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 400 when gasto is not paid", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-1",
        status: "pendente",
        cartaoCreditoId: null,
      });

      await expect(gastoService.reabrirGasto("gasto-1", "user-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 400 when gasto belongs to a credit card", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-1",
        status: "pago",
        cartaoCreditoId: "cartao-1",
      });

      await expect(gastoService.reabrirGasto("gasto-1", "user-1")).rejects.toMatchObject({
        statusCode: 400,
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
        message: "Gasto marcado como excluido com sucesso.",
      });

      expect(gastoRepository.deletarGasto).toHaveBeenCalledWith("gasto-1");
    });

    it("should throw 404 when gasto does not exist", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.deletarGasto("gasto-inexistente", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 403 when gasto belongs to another user", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-2",
      });

      await expect(gastoService.deletarGasto("gasto-1", "user-1")).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("should recalculate linked invoices when deleting credit card installments", async () => {
      (gastoRepository.buscarGastoPorId as jest.Mock).mockResolvedValue({
        id: "gasto-1",
        responsavelId: "user-1",
        origemLancamento: "parcelado",
        faturaCartaoId: "fatura-principal",
      });
      (gastoRepository.listarLancamentosBasePorGastoId as jest.Mock).mockResolvedValue([
        { id: "parcela-1", faturaCartaoId: "fatura-1" },
        { id: "parcela-2", faturaCartaoId: "fatura-2" },
      ]);

      await gastoService.deletarGasto("gasto-1", "user-1");

      expect(faturaCartaoRepository.recalcularValorTotal).toHaveBeenCalledWith("fatura-principal");
      expect(faturaCartaoRepository.recalcularValorTotal).toHaveBeenCalledWith("fatura-1");
      expect(faturaCartaoRepository.recalcularValorTotal).toHaveBeenCalledWith("fatura-2");
    });
  });

  describe("pagarParcela", () => {
    it("should pay an installment", async () => {
      const paymentDate = new Date("2026-08-17T00:00:00.000Z");
      const paidInstallment = { id: "parcela-1", status: "pago" };
      (gastoRepository.buscarLancamentoBasePorId as jest.Mock).mockResolvedValue({
        id: "parcela-1",
        status: "pendente",
        responsavelId: "user-1",
      });
      (gastoRepository.pagarLancamentoBase as jest.Mock).mockResolvedValue(paidInstallment);

      await expect(gastoService.pagarParcela("parcela-1", { dataPagamento: paymentDate }, "user-1")).resolves.toEqual(paidInstallment);
      expect(gastoRepository.pagarLancamentoBase).toHaveBeenCalledWith("parcela-1", paymentDate);
    });

    it("should throw 404 when installment does not exist", async () => {
      (gastoRepository.buscarLancamentoBasePorId as jest.Mock).mockResolvedValue(null);

      await expect(gastoService.pagarParcela("parcela-1", {}, "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("should throw 400 when installment is already paid", async () => {
      (gastoRepository.buscarLancamentoBasePorId as jest.Mock).mockResolvedValue({
        id: "parcela-1",
        status: "pago",
        responsavelId: "user-1",
      });

      await expect(gastoService.pagarParcela("parcela-1", {}, "user-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should throw 403 when installment belongs to another user", async () => {
      (gastoRepository.buscarLancamentoBasePorId as jest.Mock).mockResolvedValue({
        id: "parcela-1",
        status: "pendente",
        responsavelId: "user-2",
      });

      await expect(gastoService.pagarParcela("parcela-1", {}, "user-1")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});
