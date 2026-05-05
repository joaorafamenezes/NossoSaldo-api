import request from "supertest";
import createHttpError from "http-errors";

describe("app error middleware", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return the http error status and message for operational errors", async () => {
    jest.doMock("./routers/mainRouter", () => {
      const express = require("express");
      const router = express.Router();

      router.get("/boom", (_req: unknown, _res: unknown, next: (error: Error) => void) => {
        next(createHttpError(400, "Falha controlada"));
      });

      return { router };
    });

    const { app } = await import("./app");
    const response = await request(app).get("/boom");

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          code: "BAD_REQUEST",
          message: "Falha controlada",
        },
      }),
    );
    expect(response.body.requestId).toEqual(expect.any(String));
  });

  it("should return validation details for 422 errors", async () => {
    jest.doMock("./routers/mainRouter", () => {
      const express = require("express");
      const router = express.Router();

      router.get("/validation", (_req: unknown, _res: unknown, next: (error: Error) => void) => {
        next(createHttpError(422, "Dados de entrada invalidos.", { code: "VALIDATION_ERROR", details: ["campo obrigatorio"] }));
      });

      return { router };
    });

    const { app } = await import("./app");
    const response = await request(app).get("/validation");

    expect(response.status).toBe(422);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados de entrada invalidos.",
          details: ["campo obrigatorio"],
        },
      }),
    );
  });

  it("should return 500 when route passes a generic Error to next", async () => {
    jest.doMock("./routers/mainRouter", () => {
      const express = require("express");
      const router = express.Router();

      router.get("/non-http-error", (_req: unknown, _res: unknown, next: (error: Error) => void) => {
        next(new Error("falha"));
      });

      return { router };
    });

    const { app } = await import("./app");
    const response = await request(app).get("/non-http-error");

    expect(response.status).toBe(500);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro interno no servidor.",
        },
      }),
    );
    expect(response.body.requestId).toEqual(expect.any(String));
  });
});
