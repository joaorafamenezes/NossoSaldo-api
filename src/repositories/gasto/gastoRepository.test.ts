export {};

let mockPrisma: any;

jest.mock("@prisma/client", () => {
  mockPrisma = {
    gasto: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    contaConjunta: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(async (callback: any) => callback({
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([]),
      gasto: {
        update: jest.fn(),
      },
    })),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {
      sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
      join: (values: unknown[]) => values,
      empty: {},
    },
  };
});

const { gastoRepository } = require("./gastoRepository");

describe("GastoRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.contaConjunta.findMany.mockResolvedValue([]);
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback({
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([]),
      gasto: {
        update: mockPrisma.gasto.update,
      },
    }));
  });

  it("should create gasto successfully", async () => {
    const payload = {
      descricao: "Mercado",
      tipo: "despesa",
      status: "pendente",
      origemLancamento: "unico",
      numeroParcelas: 1,
      valor: 100,
      categoriaId: "cat-1",
      responsavelId: "user-1",
    };
    mockPrisma.gasto.findFirst.mockResolvedValue({ id: "gasto-1", ...payload });

    await expect(gastoRepository.criarGastoUsuarioLogado(payload as any)).resolves.toEqual({
      id: "gasto-1",
      ...payload,
    });

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("should create lancamento base records for installment expenses", async () => {
    const executeRaw = jest.fn();
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback({
      $executeRaw: executeRaw,
      $queryRaw: jest.fn().mockResolvedValue([]),
    }));

    const payload = {
      descricao: "Parcela do carro",
      tipo: "despesa",
      status: "pendente",
      origemLancamento: "parcelado",
      numeroParcelas: 2,
      valor: 1000,
      dataVencimento: new Date("2026-05-15T00:00:00.000Z"),
      categoriaId: "cat-1",
      responsavelId: "user-1",
    };
    mockPrisma.gasto.findFirst.mockResolvedValue({ id: "gasto-1", ...payload });

    await expect(gastoRepository.criarGastoUsuarioLogado(payload as any)).resolves.toEqual({
      id: "gasto-1",
      ...payload,
    });

    expect(executeRaw).toHaveBeenCalledTimes(4);
  });

  it("should map create gasto errors to 500", async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error("Database unavailable"));

    await expect(gastoRepository.criarGastoUsuarioLogado({} as any)).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("should list gastos by responsavel id", async () => {
    const gastos = [{ id: "gasto-1" }, { id: "gasto-2" }];
    mockPrisma.contaConjunta.findMany.mockResolvedValue([
      { usuario1Id: "user-1", usuario2Id: "user-2" },
    ]);
    mockPrisma.$queryRaw
      .mockResolvedValueOnce(gastos)
      .mockResolvedValueOnce([]);

    await expect(gastoRepository.listarGastosPorResponsavelId("user-1")).resolves.toEqual([
      { id: "gasto-1", lancamentosBase: [] },
      { id: "gasto-2", lancamentosBase: [] },
    ]);
    expect(mockPrisma.contaConjunta.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it("should map list gastos errors to 500", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("Database unavailable"));

    await expect(gastoRepository.listarGastosPorResponsavelId("user-1")).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("should return total gasto mes atual from aggregate", async () => {
    mockPrisma.gasto.aggregate.mockResolvedValue({ _sum: { valor: 450.25 } });

    await expect(
      gastoRepository.buscarTotalGastoMesAtualPorResponsavelId("user-1", new Date("2026-04-01"), new Date("2026-05-01")),
    ).resolves.toBe(450.25);
  });

  it("should return zero when aggregate sum is null", async () => {
    mockPrisma.gasto.aggregate.mockResolvedValue({ _sum: { valor: null } });

    await expect(
      gastoRepository.buscarTotalGastoMesAtualPorResponsavelId("user-1", new Date("2026-04-01"), new Date("2026-05-01")),
    ).resolves.toBe(0);
  });

  it("should map aggregate total errors to 500", async () => {
    mockPrisma.gasto.aggregate.mockRejectedValue(new Error("Database unavailable"));

    await expect(
      gastoRepository.buscarTotalGastoMesAtualPorResponsavelId("user-1", new Date("2026-04-01"), new Date("2026-05-01")),
    ).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("should find gasto by id", async () => {
    const gasto = { id: "gasto-1", descricao: "Mercado" };
    mockPrisma.gasto.findFirst.mockResolvedValue(gasto);

    await expect(gastoRepository.buscarGastoPorId("gasto-1")).resolves.toEqual(gasto);
  });

  it("should map find gasto by id errors to 500", async () => {
    mockPrisma.gasto.findFirst.mockRejectedValue(new Error("Database unavailable"));

    await expect(gastoRepository.buscarGastoPorId("gasto-1")).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("should pay gasto successfully", async () => {
    const gastoPago = { id: "gasto-1", status: "pago" };
    mockPrisma.gasto.update.mockResolvedValue(gastoPago);

    await expect(gastoRepository.pagarGasto("gasto-1", new Date("2026-04-29"))).resolves.toEqual(gastoPago);
  });

  it("should map pay gasto errors to 500", async () => {
    mockPrisma.gasto.update.mockRejectedValue(new Error("Database unavailable"));

    await expect(gastoRepository.pagarGasto("gasto-1", new Date("2026-04-29"))).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("should update gasto successfully", async () => {
    const gastoAtualizado = { id: "gasto-1", descricao: "Mercado atualizado" };
    mockPrisma.gasto.update.mockResolvedValue(gastoAtualizado);

    await expect(gastoRepository.atualizarGasto("gasto-1", { descricao: "Mercado atualizado" })).resolves.toEqual(gastoAtualizado);
  });

  it("should refresh installment records when updating an installment expense", async () => {
    const executeRaw = jest.fn();
    const queryRaw = jest.fn().mockResolvedValue([
      { numeroParcela: 1, dataPagamentoParcela: null },
      { numeroParcela: 2, dataPagamentoParcela: null },
    ]);
    const gastoAtualizado = {
      id: "gasto-1",
      descricao: "Parcela do carro atualizada",
      tipo: "despesa",
      status: "pendente",
      origemLancamento: "parcelado",
      numeroParcelas: 2,
      valor: 1200,
      dataVencimento: new Date("2026-05-15T00:00:00.000Z"),
      observacao: null,
    };

    mockPrisma.gasto.update.mockResolvedValue(gastoAtualizado);
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback({
      $executeRaw: executeRaw,
      $queryRaw: queryRaw,
      gasto: {
        update: mockPrisma.gasto.update,
      },
    }));

    await expect(gastoRepository.atualizarGasto("gasto-1", { valor: 1200 })).resolves.toEqual(gastoAtualizado);

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(executeRaw).toHaveBeenCalledTimes(3);
  });

  it("should map update gasto errors to 500", async () => {
    mockPrisma.gasto.update.mockRejectedValue(new Error("Database unavailable"));

    await expect(gastoRepository.atualizarGasto("gasto-1", { descricao: "Mercado atualizado" })).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("should soft delete gasto successfully", async () => {
    const gastoExcluido = { id: "gasto-1", status: "cancelado" };
    mockPrisma.gasto.update.mockResolvedValue(gastoExcluido);

    await expect(gastoRepository.deletarGasto("gasto-1")).resolves.toEqual(gastoExcluido);
  });

  it("should map delete gasto errors to 500", async () => {
    mockPrisma.gasto.update.mockRejectedValue(new Error("Database unavailable"));

    await expect(gastoRepository.deletarGasto("gasto-1")).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
