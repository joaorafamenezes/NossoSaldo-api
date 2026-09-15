import { migrateRecorrenciasToModel } from "./migrateRecorrenciasToModel";

describe("migrateRecorrenciasToModel", () => {
  it("deve retornar zeros quando nao houver gastos recorrentes", async () => {
    const mockPrisma = {
      gasto: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn(),
      },
      recorrencia: {
        create: jest.fn(),
      },
    };

    const resultado = await migrateRecorrenciasToModel(mockPrisma as any);

    expect(resultado).toEqual({
      seriesProcessadas: 0,
      gastosVinculados: 0,
      seriesIgnoradas: 0,
    });
    expect(mockPrisma.recorrencia.create).not.toHaveBeenCalled();
    expect(mockPrisma.gasto.updateMany).not.toHaveBeenCalled();
  });

  it("deve agrupar gastos da mesma serie, criar Recorrencia e vincular recorrenciaId", async () => {
    const dataVenc = new Date("2026-09-10T12:00:00Z");
    const gastosMock = [
      {
        id: "gasto-raiz-1",
        descricao: "Plano Internet Fibra",
        tipo: "despesa",
        valor: 120.0,
        dataVencimento: dataVenc,
        dataInicioRecorrencia: dataVenc,
        dataFimRecorrencia: null,
        naoCompartilhar: false,
        observacao: "Fibra 500MB",
        categoriaId: "cat-1",
        responsavelId: "user-1",
        cartaoCreditoId: null,
        recorrenciaPaiId: null,
        recorrenciaId: null,
      },
      {
        id: "gasto-filho-1",
        descricao: "Plano Internet Fibra",
        tipo: "despesa",
        valor: 120.0,
        dataVencimento: new Date("2026-10-10T12:00:00Z"),
        dataInicioRecorrencia: dataVenc,
        dataFimRecorrencia: null,
        naoCompartilhar: false,
        observacao: "Fibra 500MB",
        categoriaId: "cat-1",
        responsavelId: "user-1",
        cartaoCreditoId: null,
        recorrenciaPaiId: "gasto-raiz-1",
        recorrenciaId: null,
      },
    ];

    const mockPrisma = {
      gasto: {
        findMany: jest.fn().mockResolvedValue(gastosMock),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      recorrencia: {
        create: jest.fn().mockResolvedValue({ id: "nova-recorrencia-id" }),
      },
    };

    const resultado = await migrateRecorrenciasToModel(mockPrisma as any);

    expect(resultado).toEqual({
      seriesProcessadas: 1,
      gastosVinculados: 2,
      seriesIgnoradas: 0,
    });
    expect(mockPrisma.recorrencia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        descricao: "Plano Internet Fibra",
        tipo: "despesa",
        valor: 120.0,
        diaVencimento: 10,
        frequencia: "mensal",
        categoriaId: "cat-1",
        responsavelId: "user-1",
      }),
    });
    expect(mockPrisma.gasto.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["gasto-raiz-1", "gasto-filho-1"] },
      },
      data: {
        recorrenciaId: "nova-recorrencia-id",
      },
    });
  });

  it("deve ignorar series que ja possuem recorrenciaId vinculado (idempotencia)", async () => {
    const gastosMock = [
      {
        id: "gasto-raiz-1",
        descricao: "Netflix",
        tipo: "despesa",
        valor: 55.9,
        dataVencimento: new Date(),
        recorrenciaPaiId: null,
        recorrenciaId: "recorrencia-existente-123",
      },
    ];

    const mockPrisma = {
      gasto: {
        findMany: jest.fn().mockResolvedValue(gastosMock),
        updateMany: jest.fn(),
      },
      recorrencia: {
        create: jest.fn(),
      },
    };

    const resultado = await migrateRecorrenciasToModel(mockPrisma as any);

    expect(resultado).toEqual({
      seriesProcessadas: 0,
      gastosVinculados: 0,
      seriesIgnoradas: 1,
    });
    expect(mockPrisma.recorrencia.create).not.toHaveBeenCalled();
    expect(mockPrisma.gasto.updateMany).not.toHaveBeenCalled();
  });
});
