import express from "express";
import request from "supertest";

describe("gastoRouter", () => {
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
    jest.doMock("../../controllers/gasto/gastoController", () => ({
      gastoController: {
        buscarTotalGastoMesAtual: jest.fn(),
        listarGastosPorUsuarioLogado: jest.fn(),
        detalharGasto: jest.fn(),
        criarGastoUsuarioLogado: jest.fn(),
        atualizarGasto: jest.fn(),
        pagarGasto: jest.fn(),
        deletarGasto: jest.fn(),
        ...overrides,
      },
    }));
  }

  it("should delegate GET /gastos/total/mes-atual to gastoController.buscarTotalGastoMesAtual", async () => {
    const buscarTotalGastoMesAtual = jest.fn(async (_req, res) => {
      res.status(200).json({ referencia: "2026-04", totalGastoMesAtual: 350.25 });
    });

    setupMocks({ buscarTotalGastoMesAtual });

    const { gastoRouter } = await import("./gastoRouter");
    const app = express();
    app.use(express.json());
    app.use(gastoRouter);

    const response = await request(app).get("/gastos/total/mes-atual");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ referencia: "2026-04", totalGastoMesAtual: 350.25 });
    expect(buscarTotalGastoMesAtual).toHaveBeenCalledTimes(1);
  });

  it("should delegate GET /gastos to gastoController.listarGastosPorUsuarioLogado", async () => {
    const listarGastosPorUsuarioLogado = jest.fn(async (_req, res) => {
      res.status(200).json({ gastos: [], totalRegistros: 0 });
    });

    setupMocks({ listarGastosPorUsuarioLogado });

    const { gastoRouter } = await import("./gastoRouter");
    const app = express();
    app.use(express.json());
    app.use(gastoRouter);

    const response = await request(app).get("/gastos");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ gastos: [], totalRegistros: 0 });
    expect(listarGastosPorUsuarioLogado).toHaveBeenCalledTimes(1);
  });

  it("should delegate GET /gastos/:id to gastoController.detalharGasto", async () => {
    const detalharGasto = jest.fn(async (req, res) => {
      res.status(200).json({ id: req.params.id, descricao: "Mercado" });
    });

    setupMocks({ detalharGasto });

    const { gastoRouter } = await import("./gastoRouter");
    const app = express();
    app.use(express.json());
    app.use(gastoRouter);

    const response = await request(app).get("/gastos/gasto-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "gasto-1", descricao: "Mercado" });
    expect(detalharGasto).toHaveBeenCalledTimes(1);
  });

  it("should delegate POST /gastosUsuarioLogado to gastoController.criarGastoUsuarioLogado", async () => {
    const criarGastoUsuarioLogado = jest.fn(async (req, res) => {
      res.status(201).json({ id: "gasto-1", ...req.body });
    });

    setupMocks({ criarGastoUsuarioLogado });

    const { gastoRouter } = await import("./gastoRouter");
    const app = express();
    app.use(express.json());
    app.use(gastoRouter);

    const response = await request(app)
      .post("/gastosUsuarioLogado")
      .send({ descricao: "Mercado", valor: 199.9 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: "gasto-1", descricao: "Mercado", valor: 199.9 });
    expect(criarGastoUsuarioLogado).toHaveBeenCalledTimes(1);
  });

  it("should delegate PATCH /gastos/:id to gastoController.atualizarGasto", async () => {
    const atualizarGasto = jest.fn(async (req, res) => {
      res.status(200).json({ id: req.params.id, ...req.body });
    });

    setupMocks({ atualizarGasto });

    const { gastoRouter } = await import("./gastoRouter");
    const app = express();
    app.use(express.json());
    app.use(gastoRouter);

    const response = await request(app)
      .patch("/gastos/gasto-1")
      .send({ descricao: "Mercado atualizado", valor: 199.9 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "gasto-1", descricao: "Mercado atualizado", valor: 199.9 });
    expect(atualizarGasto).toHaveBeenCalledTimes(1);
  });

  it("should delegate PATCH /pagarGastos/:id/pagamento to gastoController.pagarGasto", async () => {
    const pagarGasto = jest.fn(async (req, res) => {
      res.status(200).json({ id: req.params.id, ...req.body, status: "pago" });
    });

    setupMocks({ pagarGasto });

    const { gastoRouter } = await import("./gastoRouter");
    const app = express();
    app.use(express.json());
    app.use(gastoRouter);

    const response = await request(app)
      .patch("/pagarGastos/gasto-1/pagamento")
      .send({ dataPagamento: "2026-04-29T12:00:00.000Z" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "gasto-1",
      dataPagamento: "2026-04-29T12:00:00.000Z",
      status: "pago",
    });
    expect(pagarGasto).toHaveBeenCalledTimes(1);
  });

  it("should delegate DELETE /gastos/:id to gastoController.deletarGasto", async () => {
    const deletarGasto = jest.fn(async (_req, res) => {
      res.status(200).json({ message: "Gasto marcado como excluido com sucesso." });
    });

    setupMocks({ deletarGasto });

    const { gastoRouter } = await import("./gastoRouter");
    const app = express();
    app.use(express.json());
    app.use(gastoRouter);

    const response = await request(app).delete("/gastos/gasto-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Gasto marcado como excluido com sucesso." });
    expect(deletarGasto).toHaveBeenCalledTimes(1);
  });
});
