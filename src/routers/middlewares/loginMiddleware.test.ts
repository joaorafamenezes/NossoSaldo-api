import { NextFunction, Request, Response } from "express";
import validateLogin from "./loginMiddleware";
import auth from "../../secure/authorization";

jest.mock("../../secure/authorization", () => ({
  __esModule: true,
  default: {
    verifyToken: jest.fn(),
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
        message: "Token não fornecido",
      }),
    );
    expect(auth.verifyToken).not.toHaveBeenCalled();
  });

  it("should forward 401 when token is invalid", async () => {
    req.headers = { "x-access-token": "token-invalido" };
    (auth.verifyToken as jest.Mock).mockResolvedValue(null);

    await validateLogin(req as Request, res as Response, next);

    expect(auth.verifyToken).toHaveBeenCalledWith("token-invalido");
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Token inválido",
      }),
    );
  });

  it("should call next and attach payload to res.locals when token is valid", async () => {
    req.headers = { "x-access-token": "token-valido" };
    (auth.verifyToken as jest.Mock).mockResolvedValue({ id: "user-id" });

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
