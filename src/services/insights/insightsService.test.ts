import { insightsService } from "./insightsService";
import { insightsRepository } from "../../repositories/insights/insightsRepository";
import { gastoService } from "../gasto/gastoService";

jest.mock("../../repositories/insights/insightsRepository");
jest.mock("../gasto/gastoService");

describe("InsightsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (gastoService.gerarGastosRecorrentesPorPeriodo as jest.Mock).mockResolvedValue(undefined);
  });

  it("should generate high attention insights when financial bottlenecks are found", async () => {
    (insightsRepository.listarGastosPorPeriodo as jest.Mock)
      .mockResolvedValueOnce([
        { id: "1", tipo: "receita", status: "pago", valor: "5000", competencia: new Date("2026-06-05"), categoriaId: "c1", categoriaDescricao: "Salario" },
        { id: "2", tipo: "despesa", status: "pendente", valor: "400", competencia: new Date("2026-06-06"), categoriaId: "c2", categoriaDescricao: "Moradia" },
        { id: "3", tipo: "despesa", status: "pendente", valor: "500", competencia: new Date("2026-06-07"), categoriaId: "c2", categoriaDescricao: "Moradia" },
        { id: "4", tipo: "despesa", status: "pendente", valor: "1200", competencia: new Date("2026-06-08"), categoriaId: "c2", categoriaDescricao: "Moradia" },
        { id: "5", tipo: "despesa", status: "pendente", valor: "850", competencia: new Date("2026-06-09"), categoriaId: "c3", categoriaDescricao: "Alimentacao" },
        { id: "6", tipo: "despesa", status: "atrasado", valor: "150", competencia: new Date("2026-06-10"), categoriaId: "c4", categoriaDescricao: "Transporte" },
        { id: "7", tipo: "despesa", status: "atrasado", valor: "100", competencia: new Date("2026-06-11"), categoriaId: "c4", categoriaDescricao: "Transporte" },
        { id: "8", tipo: "despesa", status: "pago", valor: "1400", competencia: new Date("2026-06-12"), categoriaId: "c5", categoriaDescricao: "Saude" },
      ])
      .mockResolvedValueOnce([
        { id: "9", tipo: "receita", status: "pago", valor: "5200", competencia: new Date("2026-05-05"), categoriaId: "c1", categoriaDescricao: "Salario" },
        { id: "10", tipo: "despesa", status: "pago", valor: "3600", competencia: new Date("2026-05-08"), categoriaId: "c2", categoriaDescricao: "Moradia" },
      ]);

    const result = await insightsService.gerarInsightsGargalos("2026-06-01", "2026-06-30", "user-1");

    expect(gastoService.gerarGastosRecorrentesPorPeriodo).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date),
      expect.any(Date),
    );
    expect(result.agente.nome).toBe("Radar");
    expect(result.nivelAtencao).toBe("alto");
    expect(result.indicadores.percentualUsoReceita).toBe(92);
    expect(result.gargalos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ codigo: "COMPROMETIMENTO_RENDA" }),
        expect.objectContaining({ codigo: "GASTOS_ATRASADOS" }),
        expect.objectContaining({ codigo: "GASTOS_PENDENTES" }),
        expect.objectContaining({ codigo: "ALTA_DESPESAS" }),
        expect.objectContaining({ codigo: "CONCENTRACAO_CATEGORIA" }),
      ]),
    );
  });

  it("should return a calm summary when no bottleneck is found", async () => {
    (insightsRepository.listarGastosPorPeriodo as jest.Mock)
      .mockResolvedValueOnce([
        { id: "1", tipo: "receita", status: "pago", valor: "4000", competencia: new Date("2026-06-05"), categoriaId: "c1", categoriaDescricao: "Salario" },
        { id: "2", tipo: "despesa", status: "pago", valor: "700", competencia: new Date("2026-06-06"), categoriaId: "c2", categoriaDescricao: "Transporte" },
        { id: "3", tipo: "despesa", status: "pago", valor: "750", competencia: new Date("2026-06-07"), categoriaId: "c3", categoriaDescricao: "Mercado" },
        { id: "4", tipo: "despesa", status: "pago", valor: "750", competencia: new Date("2026-06-08"), categoriaId: "c4", categoriaDescricao: "Moradia" },
      ])
      .mockResolvedValueOnce([
        { id: "5", tipo: "receita", status: "pago", valor: "3900", competencia: new Date("2026-05-05"), categoriaId: "c1", categoriaDescricao: "Salario" },
        { id: "6", tipo: "despesa", status: "pago", valor: "2300", competencia: new Date("2026-05-08"), categoriaId: "c2", categoriaDescricao: "Moradia" },
      ]);

    const result = await insightsService.gerarInsightsGargalos("2026-06-01", "2026-06-30", "user-1");

    expect(result.nivelAtencao).toBe("baixo");
    expect(result.gargalos).toEqual([]);
    expect(result.dicas).toEqual([
      "Seus gastos estao equilibrados no periodo. Continue acompanhando as categorias com maior valor para manter o controle.",
    ]);
  });
});
