import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { relatorioController } from "./relatorioController";
import { relatorioService } from "../../services/relatorio/relatorioService";

jest.mock("../../services/relatorio/relatorioService");

describe("RelatorioController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      params: {
        de: "2026-08-01",
        ate: "2026-08-31",
        mesAtual: "2026-08-31",
        mesAnterior: "2026-07-01",
      },
    };
    res = {
      locals: { payload: { id: "user-1" } },
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  it("should generate monthly evolution report", async () => {
    const report = [{ referencia: "2026-08" }];
    (relatorioService.gerarRelatorioEvolucaoMensal as jest.Mock).mockResolvedValue(report);

    await relatorioController.gerarRelatorioEvolucaoMensal(req as Request, res as Response, next);

    expect(relatorioService.gerarRelatorioEvolucaoMensal).toHaveBeenCalledWith("2026-08-01", "2026-08-31", "user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: report });
  });

  it("should reject evolution period when ate is before de", async () => {
    req.params = { de: "2026-08-31", ate: "2026-08-01" };

    await relatorioController.gerarRelatorioEvolucaoMensal(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "BAD_REQUEST",
        message: "O parametro 'ate' deve ser maior ou igual ao parametro 'de'.",
      },
    });
  });

  it("should generate monthly comparison report", async () => {
    const report = { mesAtual: 100, mesAnterior: 50, variacao: "+100.0%" };
    (relatorioService.gerarRelatorioComparativoMensal as jest.Mock).mockResolvedValue(report);

    await relatorioController.gerarRelatorioComparativoMensal(req as Request, res as Response, next);

    expect(relatorioService.gerarRelatorioComparativoMensal).toHaveBeenCalledWith("2026-08-31", "2026-07-01", "user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: report });
  });

  it("should reject monthly comparison when current month is before previous month", async () => {
    req.params = { mesAtual: "2026-07-01", mesAnterior: "2026-08-01" };

    await relatorioController.gerarRelatorioComparativoMensal(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "BAD_REQUEST",
        message: "O parametro 'mesAtual' deve ser maior ou igual ao parametro 'mesAnterior'.",
      },
    });
  });

  it("should generate top category report", async () => {
    const report = [{ categoria: "Moradia" }];
    (relatorioService.gerarRelatorioTopCategoria as jest.Mock).mockResolvedValue(report);

    await relatorioController.gerarRelatorioTopCategoria(req as Request, res as Response, next);

    expect(relatorioService.gerarRelatorioTopCategoria).toHaveBeenCalledWith("2026-08-01", "2026-08-31", "user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it("should generate who spends more report", async () => {
    const report = { usuario1: { nome: "Joao" }, usuario2: { nome: "Maria" } };
    (relatorioService.gerarRelatorioQuemGastaMais as jest.Mock).mockResolvedValue(report);

    await relatorioController.gerarRelatorioQuemGastaMais(req as Request, res as Response, next);

    expect(relatorioService.gerarRelatorioQuemGastaMais).toHaveBeenCalledWith("2026-08-01", "2026-08-31", "user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
  });

  it("should forward service errors", async () => {
    const error = new Error("falha");
    (relatorioService.gerarRelatorioQuemGastaMais as jest.Mock).mockRejectedValue(error);

    await relatorioController.gerarRelatorioQuemGastaMais(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
