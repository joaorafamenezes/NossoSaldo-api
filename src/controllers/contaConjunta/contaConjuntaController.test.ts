import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { contaConjuntaController } from "./contaConjuntaController";
import { contaConjuntaService } from "../../services/contaConjunta/contaConjuntaService";

jest.mock("../../services/contaConjunta/contaConjuntaService");

describe("ContaConjuntaController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const mockContaConjunta = {
    id: "conta-1",
    nomeConta: "Casa",
    usuario1Id: "user-1",
    usuario2Id: "user-2",
  };

  beforeEach(() => {
    mockRequest = {
      body: {
        nomeConta: "Casa",
        usuario1Id: "user-1",
        usuario2Id: "user-2",
      },
    };

    mockResponse = {
      locals: {
        payload: { id: "user-1" },
      },
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  it("should create conta conjunta successfully and return 201", async () => {
    (contaConjuntaService.criarContaConjunta as jest.Mock).mockResolvedValue(mockContaConjunta);

    await contaConjuntaController.criarContaConjunta(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(contaConjuntaService.criarContaConjunta).toHaveBeenCalledWith(mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(mockResponse.json).toHaveBeenCalledWith(mockContaConjunta);
  });

  it("should call next when create conta conjunta fails", async () => {
    const error = new Error("falha ao criar conta conjunta");
    (contaConjuntaService.criarContaConjunta as jest.Mock).mockRejectedValue(error);

    await contaConjuntaController.criarContaConjunta(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should list contas conjuntas by logged user and return 200", async () => {
    (contaConjuntaService.listarContasConjuntasPorUsuarioId as jest.Mock).mockResolvedValue([mockContaConjunta]);

    await contaConjuntaController.listarContasConjuntasPorUsuarioId(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(contaConjuntaService.listarContasConjuntasPorUsuarioId).toHaveBeenCalledWith("user-1");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith([mockContaConjunta]);
  });

  it("should call next when listing contas conjuntas fails", async () => {
    const error = new Error("falha ao listar contas conjuntas");
    (contaConjuntaService.listarContasConjuntasPorUsuarioId as jest.Mock).mockRejectedValue(error);

    await contaConjuntaController.listarContasConjuntasPorUsuarioId(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
