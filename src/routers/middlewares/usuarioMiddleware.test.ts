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
        "string.empty": "O nome é obrigatório.",
        "any.required": "O nome é obrigatório.",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "O email é inválido.",
        "any.required": "O email é obrigatório.",
      }),
      senha: Joi.string().min(6).max(50).required().messages({
        "string.min": "A senha deve ter pelo menos 6 caracteres.",
        "string.max": "A senha não pode ter mais de 50 caracteres.",
        "any.required": "A senha é obrigatória.",
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
      nome: "João Silva",
      email: "joao@example.com",
      senha: "senha123",
    };

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it("should strip unknown fields from body", () => {
    const middleware = validateCreateUser(createTestSchema());

    mockRequest.body = {
      nome: "João Silva",
      email: "joao@example.com",
      senha: "senha123",
      extra: "campo-extra",
    };

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.body).toEqual({
      nome: "João Silva",
      email: "joao@example.com",
      senha: "senha123",
    });
  });

  it("should forward a 400 http error with validation details", () => {
    const middleware = validateCreateUser(createTestSchema());

    mockRequest.body = {
      nome: "",
      email: "invalid-email",
      senha: "123",
    };

    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Dados de entrada inválidos.",
        details: expect.arrayContaining([
          "O nome é obrigatório.",
          "O email é inválido.",
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
