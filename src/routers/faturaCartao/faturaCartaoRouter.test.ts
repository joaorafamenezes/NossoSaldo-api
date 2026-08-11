import express from "express";
import request from "supertest";

describe("faturaCartaoRouter", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function setupMocks(overrides: Record<string, jest.Mock> = {}) {
    jest.doMock("../middlewares/loginMiddleware", () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock("../middlewares/usuarioMiddleware", () => ({
      validateUser: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock("../../controllers/faturaCartao/faturaCartaoController", () => ({
      faturaCartaoController: {
        listarFaturas: jest.fn(),
        pagarFatura: jest.fn(),
        reabrirFatura: jest.fn(),
        ...overrides,
      },
    }));
  }

  it("should delegate GET /faturasCartao to faturaCartaoController.listarFaturas", async () => {
    const listarFaturas = jest.fn(async (_req, res) => {
      res.status(200).json({ data: [{ id: "invoice-1" }], meta: { total: 1 } });
    });

    setupMocks({ listarFaturas });

    const { faturaCartaoRouter } = await import("./faturaCartaoRouter");
    const app = express();
    app.use(express.json());
    app.use(faturaCartaoRouter);

    const response = await request(app).get("/faturasCartao");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ id: "invoice-1" }], meta: { total: 1 } });
    expect(listarFaturas).toHaveBeenCalledTimes(1);
  });

  it("should delegate PATCH /faturasCartao/:id/pagamento to faturaCartaoController.pagarFatura", async () => {
    const pagarFatura = jest.fn(async (req, res) => {
      res.status(200).json({ id: req.params.id, ...req.body, status: "paga" });
    });

    setupMocks({ pagarFatura });

    const { faturaCartaoRouter } = await import("./faturaCartaoRouter");
    const app = express();
    app.use(express.json());
    app.use(faturaCartaoRouter);

    const response = await request(app)
      .patch("/faturasCartao/invoice-1/pagamento")
      .send({ dataPagamento: "2026-07-25T12:00:00.000Z" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "invoice-1",
      dataPagamento: "2026-07-25T12:00:00.000Z",
      status: "paga",
    });
    expect(pagarFatura).toHaveBeenCalledTimes(1);
  });

  it("should delegate PATCH /faturasCartao/:id/reabertura to faturaCartaoController.reabrirFatura", async () => {
    const reabrirFatura = jest.fn(async (req, res) => {
      res.status(200).json({ id: req.params.id, status: "aberta" });
    });

    setupMocks({ reabrirFatura });

    const { faturaCartaoRouter } = await import("./faturaCartaoRouter");
    const app = express();
    app.use(express.json());
    app.use(faturaCartaoRouter);

    const response = await request(app).patch("/faturasCartao/invoice-1/reabertura");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "invoice-1", status: "aberta" });
    expect(reabrirFatura).toHaveBeenCalledTimes(1);
  });
});
