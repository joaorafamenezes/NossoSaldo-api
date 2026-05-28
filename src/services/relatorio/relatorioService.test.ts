import { relatorioService } from "./relatorioService";
import { relatorioRepository } from "../../repositories/relatorio/relatorioRepository";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import { gastoService } from "../gasto/gastoService";

jest.mock("../../repositories/relatorio/relatorioRepository");
jest.mock("../../repositories/contaConjunta/contaConjuntaRepository");
jest.mock("../gasto/gastoService");

describe("RelatorioService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (gastoService.gerarGastosRecorrentesPorPeriodo as jest.Mock).mockResolvedValue(undefined);
  });

  it("should generate monthly evolution report after recurring expenses sync", async () => {
    const report = [{ referencia: "2026-08", total_gasto: 100 }];
    (relatorioRepository.gerarRelatorioEvolucaoMensal as jest.Mock).mockResolvedValue(report);

    await expect(relatorioService.gerarRelatorioEvolucaoMensal("2026-08-01", "2026-08-31", "user-1")).resolves.toEqual(report);
    expect(gastoService.gerarGastosRecorrentesPorPeriodo).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date),
      expect.any(Date),
    );
  });

  it("should calculate monthly comparison variation", async () => {
    (relatorioRepository.gerarRelatorioComparativoMensal as jest.Mock).mockResolvedValue([
      { referencia: "2026-08", total_despesa: "150" },
      { referencia: "2026-07", total_despesa: "100" },
    ]);

    await expect(relatorioService.gerarRelatorioComparativoMensal("2026-08-31", "2026-07-01", "user-1")).resolves.toEqual({
      mesAtual: 150,
      mesAnterior: 100,
      variacao: "+50.0%",
    });
  });

  it("should return +100.0% when previous month is zero and current month has expenses", async () => {
    (relatorioRepository.gerarRelatorioComparativoMensal as jest.Mock).mockResolvedValue([
      { referencia: "2026-08", total_despesa: 50 },
    ]);

    await expect(relatorioService.gerarRelatorioComparativoMensal("2026-08-31", "2026-07-01", "user-1")).resolves.toEqual({
      mesAtual: 50,
      mesAnterior: 0,
      variacao: "+100.0%",
    });
  });

  it("should generate top category report", async () => {
    const report = [{ categoria: "Moradia", total_gasto: 1200 }];
    (relatorioRepository.gerarRelatorioTopCategoria as jest.Mock).mockResolvedValue(report);

    await expect(relatorioService.gerarRelatorioTopCategoria("2026-08-01", "2026-08-31", "user-1")).resolves.toEqual(report);
  });

  it("should generate who spends more report for active joint account", async () => {
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([
      {
        usuario1Id: "user-1",
        usuario2Id: "user-2",
        usuario1: { id: "user-1", nome: "Joao" },
        usuario2: { id: "user-2", nome: "Maria" },
      },
    ]);
    (relatorioRepository.gerarRelatorioQuemGastaMais as jest.Mock).mockResolvedValue([
      { usuario_id: "user-1", total_gasto: "300" },
      { usuario_id: "user-2", total_gasto: "100" },
    ]);

    await expect(relatorioService.gerarRelatorioQuemGastaMais("2026-08-01", "2026-08-31", "user-1")).resolves.toEqual({
      usuario1: { nome: "Joao", total: 300, percentual: 75 },
      usuario2: { nome: "Maria", total: 100, percentual: 25 },
    });
  });

  it("should throw 404 when user has no active joint account", async () => {
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);

    await expect(relatorioService.gerarRelatorioQuemGastaMais("2026-08-01", "2026-08-31", "user-1")).rejects.toHaveProperty(
      "message",
      "Usuario nao possui conta conjunta ativa.",
    );
  });
});
