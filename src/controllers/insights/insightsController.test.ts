import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { insightsController } from "./insightsController";
import { insightsService } from "../../services/insights/insightsService";

jest.mock("../../services/insights/insightsService");

describe("InsightsController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      params: {
        de: "2026-06-01",
        ate: "2026-06-30",
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

  it("should return generated insights", async () => {
    const response = { agente: { nome: "Radar" }, gargalos: [] };
    (insightsService.gerarInsightsGargalos as jest.Mock).mockResolvedValue(response);

    await insightsController.gerarInsightsGargalos(req as Request, res as Response, next);

    expect(insightsService.gerarInsightsGargalos).toHaveBeenCalledWith("2026-06-01", "2026-06-30", "user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: response });
  });

  it("should reject period when ate is before de", async () => {
    req.params = {
      de: "2026-06-30",
      ate: "2026-06-01",
    };

    await insightsController.gerarInsightsGargalos(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "BAD_REQUEST",
        message: "O parametro 'ate' deve ser maior ou igual ao parametro 'de'.",
      },
    });
  });

  it("should forward service errors", async () => {
    const error = new Error("falha");
    (insightsService.gerarInsightsGargalos as jest.Mock).mockRejectedValue(error);

    await insightsController.gerarInsightsGargalos(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
