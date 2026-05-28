import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { faturaCartaoController } from "./faturaCartaoController";
import { faturaCartaoService } from "../../services/faturaCartao/faturaCartaoService";

jest.mock("../../services/faturaCartao/faturaCartaoService");

describe("FaturaCartaoController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      params: { id: "invoice-1" },
      query: { cartaoCreditoId: "card-1" },
      body: { dataPagamento: "2026-08-17" },
    };
    res = {
      locals: { payload: { id: "user-1" } },
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  it("should list invoices with total metadata", async () => {
    const invoices = [{ id: "invoice-1" }];
    (faturaCartaoService.listarFaturasPorUsuario as jest.Mock).mockResolvedValue(invoices);

    await faturaCartaoController.listarFaturas(req as Request, res as Response, next);

    expect(faturaCartaoService.listarFaturasPorUsuario).toHaveBeenCalledWith("user-1", "card-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: invoices, meta: { total: 1 } });
  });

  it("should ignore non-string card query", async () => {
    req.query = { cartaoCreditoId: ["card-1"] };
    (faturaCartaoService.listarFaturasPorUsuario as jest.Mock).mockResolvedValue([]);

    await faturaCartaoController.listarFaturas(req as Request, res as Response, next);

    expect(faturaCartaoService.listarFaturasPorUsuario).toHaveBeenCalledWith("user-1", undefined);
  });

  it("should pay invoice", async () => {
    const invoice = { id: "invoice-1", status: "paga" };
    (faturaCartaoService.pagarFatura as jest.Mock).mockResolvedValue(invoice);

    await faturaCartaoController.pagarFatura(req as Request, res as Response, next);

    expect(faturaCartaoService.pagarFatura).toHaveBeenCalledWith("invoice-1", req.body, "user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: invoice });
  });

  it("should reopen invoice using first id param when array is received", async () => {
    req.params = { id: ["invoice-1", "invoice-2"] as unknown as string };
    const invoice = { id: "invoice-1", status: "aberta" };
    (faturaCartaoService.reabrirFatura as jest.Mock).mockResolvedValue(invoice);

    await faturaCartaoController.reabrirFatura(req as Request, res as Response, next);

    expect(faturaCartaoService.reabrirFatura).toHaveBeenCalledWith("invoice-1", "user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: invoice });
  });

  it("should forward service errors", async () => {
    const error = new Error("falha");
    (faturaCartaoService.pagarFatura as jest.Mock).mockRejectedValue(error);

    await faturaCartaoController.pagarFatura(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
