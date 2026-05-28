import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { cartaoCreditoController } from "./cartaoCreditoController";
import { cartaoCreditoService } from "../../services/cartaoCredito/cartaoCreditoService";

jest.mock("../../services/cartaoCredito/cartaoCreditoService");

describe("CartaoCreditoController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      params: { id: "card-1" },
      body: { descricao: "Nubank" },
    };
    res = {
      locals: { payload: { id: "user-1" } },
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  it("should create credit card for authenticated user", async () => {
    const card = { id: "card-1" };
    (cartaoCreditoService.criarCartaoCredito as jest.Mock).mockResolvedValue(card);

    await cartaoCreditoController.criarCartaoCredito(req as Request, res as Response, next);

    expect(cartaoCreditoService.criarCartaoCredito).toHaveBeenCalledWith("user-1", req.body);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(res.json).toHaveBeenCalledWith({ data: card });
  });

  it("should reject create when authenticated user is missing", async () => {
    res.locals = { payload: {} };

    await cartaoCreditoController.criarCartaoCredito(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("should list credit cards with total metadata", async () => {
    const cards = [{ id: "card-1" }, { id: "card-2" }];
    (cartaoCreditoService.listarCartoesCreditoPorUsuario as jest.Mock).mockResolvedValue(cards);

    await cartaoCreditoController.listarCartoesCredito(req as Request, res as Response, next);

    expect(cartaoCreditoService.listarCartoesCreditoPorUsuario).toHaveBeenCalledWith("user-1");
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: cards, meta: { total: 2 } });
  });

  it("should update credit card using first id param when array is received", async () => {
    req.params = { id: ["card-1", "card-2"] as unknown as string };
    const card = { id: "card-1", descricao: "Inter" };
    (cartaoCreditoService.atualizarCartaoCredito as jest.Mock).mockResolvedValue(card);

    await cartaoCreditoController.atualizarCartaoCredito(req as Request, res as Response, next);

    expect(cartaoCreditoService.atualizarCartaoCredito).toHaveBeenCalledWith("card-1", "user-1", req.body);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({ data: card });
  });

  it("should forward service errors", async () => {
    const error = new Error("falha");
    (cartaoCreditoService.listarCartoesCreditoPorUsuario as jest.Mock).mockRejectedValue(error);

    await cartaoCreditoController.listarCartoesCredito(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
