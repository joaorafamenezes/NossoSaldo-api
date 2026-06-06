import express from "express";
import request from "supertest";
import { NextFunction, Request, Response } from "express";

describe("insightsRouter", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should validate params and delegate to insightsController", async () => {
    const gerarInsightsGargalos = jest.fn(async (_req, res) => {
      res.status(200).json({ data: { agente: { nome: "Radar" }, gargalos: [] } });
    });

    jest.doMock("../middlewares/loginMiddleware", () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock("../../controllers/insights/insightsController", () => ({
      insightsController: { gerarInsightsGargalos },
    }));

    const { insightsRouter } = await import("./insightsRouter");
    const app = express();
    app.use(express.json());
    app.use(insightsRouter);

    const response = await request(app).get("/insights/gargalos/2026-06-01/2026-06-30");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { agente: { nome: "Radar" }, gargalos: [] } });
    expect(gerarInsightsGargalos).toHaveBeenCalledTimes(1);
  });

  it("should return 422 for invalid param format", async () => {
    jest.doMock("../middlewares/loginMiddleware", () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));

    const { insightsRouter } = await import("./insightsRouter");
    const app = express();
    app.use(express.json());
    app.use(insightsRouter);
    app.use((err: { statusCode?: number; code?: string; message: string; details?: string[] }, _req: Request, res: Response, _next: NextFunction) => {
      return res.status(err.statusCode ?? 500).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
    });

    const response = await request(app).get("/insights/gargalos/20260601/2026-06-30");

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
