import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
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
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  it("should return 401 when token is not provided", async () => {
    await validateLogin(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ message: "Token não fornecido" });
    expect(auth.verifyToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid", async () => {
    req.headers = { "x-access-token": "token-invalido" };
    (auth.verifyToken as jest.Mock).mockResolvedValue(null);

    await validateLogin(req as Request, res as Response, next);

    expect(auth.verifyToken).toHaveBeenCalledWith("token-invalido");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next and attach payload to req.body when token is valid", async () => {
    req.headers = { "x-access-token": "token-valido" };
    (auth.verifyToken as jest.Mock).mockResolvedValue({ id: "user-id" });

    await validateLogin(req as Request, res as Response, next);

    expect(auth.verifyToken).toHaveBeenCalledWith("token-valido");
    expect((req.body as Record<string, unknown>).payload).toEqual({ id: "user-id" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 401 when verifyToken throws an exception", async () => {
    req.headers = { "x-access-token": "token-quebrado" };
    (auth.verifyToken as jest.Mock).mockRejectedValue(new Error("falha"));

    await validateLogin(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido" });
    expect(next).not.toHaveBeenCalled();
  });
});
