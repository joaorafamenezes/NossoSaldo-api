import { gastoRepository } from "./gastoRepository";
import { PrismaClient } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const mockGasto = {
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      gasto: mockGasto,
    })),
  };
});

describe("GastoRepository", () => {
  let mockPrisma: any;

  beforeEach(() => {
    const { PrismaClient } = require("@prisma/client");
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  it("should create gasto successfully", async () => {
    const payload = {
      descricao: "Mercado",
      tipo: "despesa",
      status: "pendente",
      origemLancamento: "unico",
      valor: 100,
      categoriaId: "cat-1",
      responsavelId: "user-1",
    };
    mockPrisma.gasto.create.mockResolvedValue({ id: "gasto-1", ...payload });

    await expect(gastoRepository.criarGastoUsuarioLogado(payload as any)).resolves.toEqual({
      id: "gasto-1",
      ...payload,
    });
  });

  it("should map create gasto errors to 500", async () => {
    mockPrisma.gasto.create.mockRejectedValue(new Error("Database unavailable"));

    await expect(gastoRepository.criarGastoUsuarioLogado({} as any)).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it("should list gastos by responsavel id", async () => {
    const gastos = [{ id: "gasto-1" }, { id: "gasto-2" }];
    mockPrisma.gasto.findMany.mockResolvedValue(gastos);

    await expect(gastoRepository.listarGastosPorResponsavelId("user-1")).resolves.toEqual(gastos);
  });

  it("should map list gastos errors to 500", async () => {
    mockPrisma.gasto.findMany.mockRejectedValue(new Error("Database unavailable"));

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
