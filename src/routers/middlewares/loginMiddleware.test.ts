import { NextFunction, Request, Response } from "express";
import validateLogin from "./loginMiddleware";
import auth from "../../secure/authorization";

jest.mock("../../secure/authorization", () => ({
  __esModule: true,
  default: {
    verifyToken: jest.fn(),
    getJwtDiagnostics: jest.fn(() => ({
      algorithm: "RS256",
      expiresInSeconds: 3600,
      privateKeyFingerprint: "privatefinger",
      publicKeyFingerprint: "publicfinger",
    })),
    tokenPrefix: jest.fn(() => "token-prefix"),
  },
}));

describe("loginMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      id: "req-1",
      log: {
        info: jest.fn(),
        warn: jest.fn(),
      } as unknown as Request["log"],
    };

    res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  it("should forward 401 when token is not provided", async () => {
    await validateLogin(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Token nÃƒÂ£o fornecido",
      }),
    );
    expect(auth.verifyToken).not.toHaveBeenCalled();
  });

  it("should forward 401 when token is invalid", async () => {
    req.headers = { "x-access-token": "token-invalido" };
    (auth.verifyToken as jest.Mock).mockResolvedValue({ payload: null, error: "invalid" });

    await validateLogin(req as Request, res as Response, next);

    expect(auth.verifyToken).toHaveBeenCalledWith("token-invalido");
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Token invÃƒÂ¡lido",
      }),
    );
  });

  it("should forward 401 when token is expired", async () => {
    req.headers = { "x-access-token": "token-expirado" };
    (auth.verifyToken as jest.Mock).mockResolvedValue({ payload: null, error: "expired" });

    await validateLogin(req as Request, res as Response, next);

    expect(auth.verifyToken).toHaveBeenCalledWith("token-expirado");
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Token expirado",
      }),
    );
  });

  it("should call next and attach payload to res.locals when token is valid", async () => {
    req.headers = { "x-access-token": "token-valido" };
    (auth.verifyToken as jest.Mock).mockResolvedValue({ payload: { id: "user-id" }, error: null });

    await validateLogin(req as Request, res as Response, next);

    expect(auth.verifyToken).toHaveBeenCalledWith("token-valido");
    expect(res.locals?.payload).toEqual({ id: "user-id" });
    expect(next).toHaveBeenCalledWith();
  });

  it("should forward unexpected authentication errors to the global handler", async () => {
    req.headers = { "x-access-token": "token-quebrado" };
    const error = new Error("falha");
    (auth.verifyToken as jest.Mock).mockRejectedValue(error);

    await validateLogin(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
