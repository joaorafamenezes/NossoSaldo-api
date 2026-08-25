import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { iaController } from "./iaController";
import { iaService } from "../../services/ia/iaService";

jest.mock("../../services/ia/iaService");

describe("IaController", () => {
  let request: Partial<Request>;
  let response: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    request = { body: { apiKey: "sk-test-key", modelo: "gpt-4.1-mini", pergunta: "Quanto gastei?" } };
    response = {
      locals: { payload: { id: "user-1" } },
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  it.each([
    ["configurar", "configurar", { configurada: true }],
    ["status", "status", { configurada: true }],
    ["remover", "removerConfiguracao", { configurada: false }],
    ["historico", "listarHistorico", [{ id: "history-1" }]],
    ["removerHistorico", "removerHistorico", { removido: true }],
  ])("returns success for %s", async (method, serviceMethod, result) => {
    (iaService[serviceMethod as keyof typeof iaService] as jest.Mock).mockResolvedValue(result);

    await iaController[method as keyof typeof iaController](request as Request, response as Response, next);

    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({ data: result });
    expect(next).not.toHaveBeenCalled();
  });

  it("configures the provider using the authenticated user", async () => {
    (iaService.configurar as jest.Mock).mockResolvedValue({ configurada: true });

    await iaController.configurar(request as Request, response as Response, next);

    expect(iaService.configurar).toHaveBeenCalledWith("user-1", "sk-test-key", "gpt-4.1-mini");
  });

  it("consults using the authenticated user and question", async () => {
    const result = { resposta: "R$ 100,00" };
    (iaService.consultar as jest.Mock).mockResolvedValue(result);

    await iaController.consultar(request as Request, response as Response, next);

    expect(iaService.consultar).toHaveBeenCalledWith("Quanto gastei?", "user-1");
    expect(response.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(response.json).toHaveBeenCalledWith({ data: result });
  });

  it.each([
    "configurar", "status", "remover", "historico", "removerHistorico", "consultar",
  ])("forwards %s service errors to next", async (method) => {
    const error = new Error("service failure");
    const serviceMethod = method === "remover"
      ? "removerConfiguracao"
      : method === "historico"
        ? "listarHistorico"
        : method === "removerHistorico"
          ? "removerHistorico"
          : method;
    (iaService as unknown as Record<string, jest.Mock>)[serviceMethod].mockRejectedValue(error);

    await iaController[method as keyof typeof iaController](request as Request, response as Response, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
