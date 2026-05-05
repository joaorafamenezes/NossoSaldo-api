import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { validateCreateUser } from "./usuarioMiddleware";
import iCriarUsuarioSchema from "../../@types/usuario/iCriarUsuario";

describe("validateCreateUser Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const createTestSchema = () =>
    Joi.object<iCriarUsuarioSchema>({
      nome: Joi.string().required().messages({
        "string.empty": "O nome e obrigatorio.",
        "any.required": "O nome e obrigatorio.",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "O email e invalido.",
        "any.required": "O email e obrigatorio.",
      }),
      senha: Joi.string().min(6).max(50).required().messages({
        "string.min": "A senha deve ter pelo menos 6 caracteres.",
        "string.max": "A senha nao pode ter mais de 50 caracteres.",
        "any.required": "A senha e obrigatoria.",
      }),
    });

  beforeEach(() => {
    mockRequest = {
      body: {},
    };

    mockResponse = {};
    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
  });

  it("should call next when data is valid", () => {
    const middleware = validateCreateUser(createTestSchema());

    mockRequest.body = {
      nome: "Joao Silva",
      email: "joao@example.com",
      senha: "senha123",
    };

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should strip unknown fields from body", () => {
    const middleware = validateCreateUser(createTestSchema());

    mockRequest.body = {
      nome: "Joao Silva",
      email: "joao@example.com",
      senha: "senha123",
      extra: "campo-extra",
    };

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.body).toEqual({
      nome: "Joao Silva",
      email: "joao@example.com",
      senha: "senha123",
    });
  });

  it("should forward a 422 http error with validation details", () => {
    const middleware = validateCreateUser(createTestSchema());

    mockRequest.body = {
      nome: "",
      email: "invalid-email",
      senha: "123",
    };

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: "Dados de entrada invalidos.",
        details: expect.arrayContaining([
          "O nome e obrigatorio.",
          "O email e invalido.",
          "A senha deve ter pelo menos 6 caracteres.",
        ]),
      }),
    );
  });

  it("should collect multiple validation errors", () => {
    const middleware = validateCreateUser(createTestSchema());

    mockRequest.body = {};

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    const error = mockNext.mock.calls[0][0] as unknown as { details: string[] };
    expect(error.details.length).toBeGreaterThan(1);
  });
});
