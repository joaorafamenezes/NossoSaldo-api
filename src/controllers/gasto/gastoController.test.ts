import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { gastoController } from "./gastoController";
import { gastoService } from "../../services/gasto/gastoService";

jest.mock("../../services/gasto/gastoService");

describe("GastoController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      params: { id: "gasto-1" },
      body: {
        descricao: "Mercado",
        valor: 120.5,
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

  it("should return current month total for logged user", async () => {
    const total = { referencia: "2026-04", totalGastoMesAtual: 450.75 };
    (gastoService.buscarTotalGastoMesAtualPorResponsavelId as jest.Mock).mockResolvedValue(total);

    await gastoController.buscarTotalGastoMesAtual(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(gastoService.buscarTotalGastoMesAtualPorResponsavelId).toHaveBeenCalledWith("user-1");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(total);
  });

  it("should return logged user gastos list", async () => {
    const gastos = [{ id: "gasto-1" }, { id: "gasto-2" }];
    (gastoService.listarGastosPorResponsavelId as jest.Mock).mockResolvedValue(gastos);

    await gastoController.listarGastosPorUsuarioLogado(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(gastoService.listarGastosPorResponsavelId).toHaveBeenCalledWith("user-1");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith({
      gastos,
      totalRegistros: 2,
    });
  });

  it("should return gasto details by id", async () => {
    const gasto = { id: "gasto-1", descricao: "Mercado" };
    (gastoService.detalharGastoPorId as jest.Mock).mockResolvedValue(gasto);

    await gastoController.detalharGasto(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(gastoService.detalharGastoPorId).toHaveBeenCalledWith("gasto-1", "user-1");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(gasto);
  });

  it("should create gasto for logged user and return 201", async () => {
    const gastoCriado = { id: "gasto-1", descricao: "Mercado", responsavelId: "user-1" };
    (gastoService.criarGastoUsuarioLogado as jest.Mock).mockResolvedValue(gastoCriado);

    await gastoController.criarGastoUsuarioLogado(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(gastoService.criarGastoUsuarioLogado).toHaveBeenCalledWith({
      descricao: "Mercado",
      valor: 120.5,
      responsavelId: "user-1",
    });
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(mockResponse.json).toHaveBeenCalledWith(gastoCriado);
  });

  it("should update gasto and return 200", async () => {
    const gastoAtualizado = { id: "gasto-1", descricao: "Mercado atualizado" };
    (gastoService.atualizarGasto as jest.Mock).mockResolvedValue(gastoAtualizado);

    await gastoController.atualizarGasto(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(gastoService.atualizarGasto).toHaveBeenCalledWith("gasto-1", mockRequest.body, "user-1");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(gastoAtualizado);
  });

  it("should pay gasto and return 200", async () => {
    mockRequest.body = { dataPagamento: new Date("2026-04-29T12:00:00.000Z") };
    const gastoPago = { id: "gasto-1", status: "pago" };
    (gastoService.pagarGasto as jest.Mock).mockResolvedValue(gastoPago);

    await gastoController.pagarGasto(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(gastoService.pagarGasto).toHaveBeenCalledWith("gasto-1", mockRequest.body, "user-1");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(gastoPago);
  });

  it("should delete gasto and return 200", async () => {
    const resultado = { message: "Gasto marcado como excluÃƒÆ’Ã‚Â­do com sucesso." };
    (gastoService.deletarGasto as jest.Mock).mockResolvedValue(resultado);

    await gastoController.deletarGasto(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(gastoService.deletarGasto).toHaveBeenCalledWith("gasto-1", "user-1");
    expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(resultado);
  });

  it("should call next when service throws during update", async () => {
    const error = new Error("falha ao atualizar gasto");
    (gastoService.atualizarGasto as jest.Mock).mockRejectedValue(error);

    await gastoController.atualizarGasto(
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
