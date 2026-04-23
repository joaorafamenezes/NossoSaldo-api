import { Request, Response, NextFunction } from "express";
import { usuarioControler } from "./usuarioController";
import { usuarioService } from "../../services/usuario/usuarioService";
import iCriarUsuarioSchema from "../../@types/iCriarUsuario";
import { StatusCodes } from "http-status-codes";

jest.mock("../services/usuarioService");

describe("UsuarioController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockUsuarioCriado = {
    id: "1",
    nome: "Joao Silva",
    email: "joao@example.com",
    senha: "senha-criptografada",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginPayload = {
    email: "joao@example.com",
    senha: "senha123",
  };

  const mockUsuarioListagem = {
    id: "1",
    nome: "Joao Silva",
    email: "joao@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRequest = {
      body: {
        nome: "Joao Silva",
        email: "joao@example.com",
        senha: "senha123",
      } as iCriarUsuarioSchema,
    };

    mockResponse = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  it("should create a user successfully and return 201", async () => {
    (usuarioService.criarUsuario as jest.Mock).mockResolvedValue(mockUsuarioCriado);

    await usuarioControler.criarUsuario(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(mockResponse.json).toHaveBeenCalledWith(mockUsuarioCriado);
  });

  it("should call next with error when create service throws", async () => {
    const error = new Error("Email ja existe");
    (usuarioService.criarUsuario as jest.Mock).mockRejectedValue(error);

    await usuarioControler.criarUsuario(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should return 200 with auth true and token when login succeeds", async () => {
    mockRequest.body = mockLoginPayload;
    (usuarioService.login as jest.Mock).mockResolvedValue({ token: "jwt-token-valido" });

    await usuarioControler.login(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith({
      auth: true,
      token: "jwt-token-valido",
    });
  });

  it("should forward 401 when login fails", async () => {
    mockRequest.body = mockLoginPayload;
    (usuarioService.login as jest.Mock).mockResolvedValue(null);

    await usuarioControler.login(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Login ou senha incorretos",
      }),
    );
  });

  it("should return 200 with users list", async () => {
    (usuarioService.listarUsuarios as jest.Mock).mockResolvedValue([mockUsuarioListagem]);

    await usuarioControler.listarUsuarios(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith([mockUsuarioListagem]);
  });

  it("should forward 404 when user is not found", async () => {
    mockResponse.locals = {
      payload: { id: "1" },
    };
    (usuarioService.listarUsuarioPorId as jest.Mock).mockResolvedValue(null);

    await usuarioControler.listarUsuarioPorId(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: "Usuário não encontrado",
      }),
    );
  });

  it("should return 200 with user when service finds it", async () => {
    mockResponse.locals = {
      payload: { id: "1" },
    };
    (usuarioService.listarUsuarioPorId as jest.Mock).mockResolvedValue(mockUsuarioListagem);

    await usuarioControler.listarUsuarioPorId(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(mockUsuarioListagem);
  });
});
