import express from "express";
import request from "supertest";

describe("releaseRouter", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function setupMocks(overrides: Record<string, jest.Mock> = {}) {
    jest.doMock("../middlewares/loginMiddleware", () => ({
      __esModule: true,
      default: (_req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.locals.payload = { id: "user-test-id", email: "user@test.com" };
        next();
      },
    }));

    jest.doMock("../../controllers/release/releaseController", () => ({
      releaseController: {
        obterStatus: jest.fn(),
        marcarVisualizada: jest.fn(),
        ...overrides,
      },
    }));
  }

  it("GET /releases/status delega para releaseController.obterStatus", async () => {
    const obterStatus = jest.fn(async (_req, res) => {
      res.status(200).json({ hasSeenCurrentVersion: false, latestSeenVersion: null, seenVersions: [] });
    });

    setupMocks({ obterStatus });

    const { releaseRouter } = await import("./releaseRouter");
    const app = express();
    app.use(express.json());
    app.use(releaseRouter);

    const response = await request(app).get("/releases/status?version=2.1.0");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ hasSeenCurrentVersion: false, latestSeenVersion: null, seenVersions: [] });
    expect(obterStatus).toHaveBeenCalledTimes(1);
  });

  it("POST /releases/mark-viewed delega para releaseController.marcarVisualizada", async () => {
    const marcarVisualizada = jest.fn(async (_req, res) => {
      res.status(200).json({ success: true, versao: "2.1.0" });
    });

    setupMocks({ marcarVisualizada });

    const { releaseRouter } = await import("./releaseRouter");
    const app = express();
    app.use(express.json());
    app.use(releaseRouter);

    const response = await request(app)
      .post("/releases/mark-viewed")
      .send({ versao: "2.1.0" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, versao: "2.1.0" });
    expect(marcarVisualizada).toHaveBeenCalledTimes(1);
  });
});
