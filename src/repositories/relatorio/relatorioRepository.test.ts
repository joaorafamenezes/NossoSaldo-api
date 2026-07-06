export {};

let mockPrisma: any;

jest.mock("@prisma/client", () => {
  mockPrisma = {
    gasto: {
      findMany: jest.fn(),
    },
    lancamentoBase: {
      findMany: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const { relatorioRepository } = require("./relatorioRepository");

describe("RelatorioRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.gasto.findMany.mockResolvedValue([]);
    mockPrisma.lancamentoBase.findMany.mockResolvedValue([]);
  });

  it("should build monthly evolution using only paid movements", async () => {
    mockPrisma.gasto.findMany.mockResolvedValue([
      {
        tipo: "despesa",
        valor: 300,
        dataPagamento: new Date("2026-07-03T00:00:00.000Z"),
        responsavelId: "user-1",
        categoria: { descricao: "Moradia" },
      },
    ]);
    mockPrisma.lancamentoBase.findMany.mockResolvedValue([
      {
        valorParcela: 80,
        dataPagamentoParcela: new Date("2026-07-10T00:00:00.000Z"),
        gasto: {
          tipo: "despesa",
          responsavelId: "user-1",
          categoria: { descricao: "Educacao" },
        },
      },
      {
        valorParcela: 90,
        dataPagamentoParcela: new Date("2026-08-02T00:00:00.000Z"),
        gasto: {
          tipo: "despesa",
          responsavelId: "user-1",
          categoria: { descricao: "Educacao" },
        },
      },
    ]);

    await expect(
      relatorioRepository.gerarRelatorioEvolucaoMensal(
        new Date("2026-07-01T00:00:00.000Z"),
        new Date("2026-08-31T23:59:59.999Z"),
        "user-1",
      ),
    ).resolves.toEqual([
      { referencia: "2026-07", total_gasto: 380 },
      { referencia: "2026-08", total_gasto: 90 },
    ]);
  });

  it("should build top categories using paid expenses and paid installments", async () => {
    mockPrisma.gasto.findMany.mockResolvedValue([
      {
        tipo: "despesa",
        valor: 250,
        dataPagamento: new Date("2026-07-05T00:00:00.000Z"),
        responsavelId: "user-1",
        categoria: { descricao: "Mercado" },
      },
    ]);
    mockPrisma.lancamentoBase.findMany.mockResolvedValue([
      {
        valorParcela: 120,
        dataPagamentoParcela: new Date("2026-07-09T00:00:00.000Z"),
        gasto: {
          tipo: "despesa",
          responsavelId: "user-1",
          categoria: { descricao: "Mercado" },
        },
      },
      {
        valorParcela: 500,
        dataPagamentoParcela: new Date("2026-07-12T00:00:00.000Z"),
        gasto: {
          tipo: "despesa",
          responsavelId: "user-1",
          categoria: { descricao: "Moradia" },
        },
      },
    ]);

    await expect(
      relatorioRepository.gerarRelatorioTopCategoria(
        new Date("2026-07-01T00:00:00.000Z"),
        new Date("2026-07-31T23:59:59.999Z"),
        "user-1",
      ),
    ).resolves.toEqual([
      { categoria: "Moradia", total_gasto: 500 },
      { categoria: "Mercado", total_gasto: 370 },
    ]);
  });

  it("should build spending by user using only paid expenses", async () => {
    mockPrisma.gasto.findMany.mockResolvedValue([
      {
        tipo: "despesa",
        valor: 400,
        dataPagamento: new Date("2026-07-04T00:00:00.000Z"),
        responsavelId: "user-1",
        categoria: { descricao: "Moradia" },
      },
    ]);
    mockPrisma.lancamentoBase.findMany.mockResolvedValue([
      {
        valorParcela: 150,
        dataPagamentoParcela: new Date("2026-07-06T00:00:00.000Z"),
        gasto: {
          tipo: "despesa",
          responsavelId: "user-2",
          categoria: { descricao: "Educacao" },
        },
      },
    ]);

    await expect(
      relatorioRepository.gerarRelatorioQuemGastaMais(
        new Date("2026-07-01T00:00:00.000Z"),
        new Date("2026-07-31T23:59:59.999Z"),
        "user-1",
        "user-1",
        "user-2",
      ),
    ).resolves.toEqual([
      { usuario_id: "user-1", total_gasto: 400 },
      { usuario_id: "user-2", total_gasto: 150 },
    ]);
  });
});
