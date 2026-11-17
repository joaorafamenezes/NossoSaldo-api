import { relatorioService } from "./relatorioService";
import { relatorioRepository } from "../../repositories/relatorio/relatorioRepository";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import { categoriaRepository } from "../../repositories/categoria/categoriaRepository";
import { gastoService } from "../gasto/gastoService";

jest.mock("../../repositories/relatorio/relatorioRepository");
jest.mock("../../repositories/contaConjunta/contaConjuntaRepository");
jest.mock("../../repositories/categoria/categoriaRepository");
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

  it("builds the annual projection without materializing future recurring expenses", async () => {
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([]);
    (relatorioRepository.listarMovimentosProjecaoAnual as jest.Mock).mockResolvedValue([
      {
        tipo: "receita",
        valor: 5000,
        ano: 2026,
        mes: 1,
        categoriaId: "cat-salario",
        categoriaNome: "Salario",
        responsavelId: "user-1",
      },
      {
        tipo: "despesa",
        valor: 3200,
        ano: 2026,
        mes: 1,
        categoriaId: "cat-moradia",
        categoriaNome: "Moradia",
        responsavelId: "user-1",
      },
    ]);

    const relatorio = await relatorioService.gerarProjecaoAnual("user-1", { ano: 2026 });

    expect(gastoService.gerarGastosRecorrentesPorPeriodo).not.toHaveBeenCalled();
    expect(relatorioRepository.listarMovimentosProjecaoAnual).toHaveBeenCalledWith({
      usuarioLogadoId: "user-1",
      responsavelIds: ["user-1"],
      contaConjunta: false,
    });
    expect(relatorio.saldo.meses[0]).toBe(1800);
    expect(relatorio.contaConjunta).toBeNull();
  });

  it("rejects an unknown category and a responsible outside the joint account", async () => {
    (contaConjuntaRepository.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([
      {
        usuario1Id: "user-1",
        usuario2Id: "user-2",
        usuario1: { id: "user-1", nome: "Joao" },
        usuario2: { id: "user-2", nome: "Maria" },
      },
    ]);
    (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue(null);

    await expect(relatorioService.gerarProjecaoAnual("user-1", { ano: 2026, categoriaId: "ausente" })).rejects.toHaveProperty(
      "message",
      "Categoria nao encontrada.",
    );

    (categoriaRepository.buscarCategoriaPorId as jest.Mock).mockResolvedValue({ id: "cat-1" });

    await expect(
      relatorioService.gerarProjecaoAnual("user-1", { ano: 2026, responsavelId: "user-3" }),
    ).rejects.toHaveProperty("message", "Responsavel invalido para este relatorio.");
  });
});
