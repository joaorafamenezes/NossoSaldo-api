import express from "express";
import request from "supertest";

describe("iaRouter", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  async function createTestApp() {
    const consultar = jest.fn(async (_req, res) => {
      return res.status(200).json({ data: { resposta: "Consulta processada." } });
    });
    const historico = jest.fn(async (_req, res) => {
      return res.status(200).json({ data: [{ id: "history-1", pergunta: "Teste", resposta: "Resposta" }] });
    });
    const removerHistorico = jest.fn(async (_req, res) => {
      return res.status(200).json({ data: { removido: true } });
    });

    jest.doMock("../middlewares/loginMiddleware", () => ({
      __esModule: true,
      default: (_req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.locals.payload = { id: "user-1" };
        next();
      },
    }));
    jest.doMock("../../controllers/ia/iaController", () => ({
      iaController: {
        status: jest.fn(),
        configurar: jest.fn(),
        remover: jest.fn(),
        consultar,
        historico,
        removerHistorico,
      },
    }));

    const { iaRouter } = await import("./iaRouter");
    const app = express();
    app.use(express.json());
    app.use("/api/v1", iaRouter);
    app.use((error: { statusCode?: number; code?: string; message: string; details?: string[] }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      return res.status(error.statusCode ?? 500).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    });

    return { app, consultar, historico, removerHistorico };
  }

  it("should expose POST /api/v1/ia/consultas and delegate the authenticated question", async () => {
    const { app, consultar } = await createTestApp();

    const response = await request(app)
      .post("/api/v1/ia/consultas")
      .send({ pergunta: "Qual foi meu maior gasto?" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { resposta: "Consulta processada." } });
    expect(consultar).toHaveBeenCalledTimes(1);
    expect(consultar.mock.calls[0][0].body).toEqual({ pergunta: "Qual foi meu maior gasto?" });
  });

  it("should reject an empty question", async () => {
    const { app, consultar } = await createTestApp();

    const response = await request(app)
      .post("/api/v1/ia/consultas")
      .send({ pergunta: "" });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(consultar).not.toHaveBeenCalled();
  });

  it("should expose the authenticated user's conversation history endpoints", async () => {
    const { app, historico, removerHistorico } = await createTestApp();

    const listResponse = await request(app).get("/api/v1/ia/consultas/historico");
    const deleteResponse = await request(app).delete("/api/v1/ia/consultas/historico");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data[0]).toEqual(expect.objectContaining({ id: "history-1" }));
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data).toEqual({ removido: true });
    expect(historico).toHaveBeenCalledTimes(1);
    expect(removerHistorico).toHaveBeenCalledTimes(1);
  });
});
