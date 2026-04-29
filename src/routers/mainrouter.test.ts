import request from "supertest";
import { app } from "../app";
import authorization from "../secure/authorization";

describe("GET /health", () => {
  it("should return health status", async () => {
    const response = await request(app)
      .get("/health")
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("API 'NossoSaldo'"),
      }),
    );
    expect(response.body.message).toContain("funcionando corretamente");
  });

  it("should return JSON content type", async () => {
    const response = await request(app)
      .get("/health")
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/json/);
  });
});

describe("POST /usuario", () => {
  let token: string;

  beforeAll(async () => {
    const signedToken = await authorization.sign("test-user-id");

    if (!signedToken) {
      throw new Error("Falha ao gerar token para os testes de /usuario");
    }

    token = signedToken;
  });

  it.each([
    {
      name: "nome is missing",
      userData: { email: "joao@example.com", senha: "senha123" },
      expectedDetail: "O nome é obrigatório.",
    },
    {
      name: "email is invalid",
      userData: { nome: "João Silva", email: "email-invalido", senha: "senha123" },
      expectedDetail: "O email é inválido.",
    },
    {
      name: "email is missing",
      userData: { nome: "João Silva", senha: "senha123" },
      expectedDetail: "O email é obrigatório.",
    },
    {
      name: "senha is less than 6 characters",
      userData: { nome: "João Silva", email: "joao@example.com", senha: "123" },
      expectedDetail: "A senha deve ter pelo menos 6 caracteres.",
    },
    {
      name: "senha is missing",
      userData: { nome: "João Silva", email: "joao@example.com" },
      expectedDetail: "A senha é obrigatória.",
    },
  ])("should return 400 when $name", async ({ userData, expectedDetail }) => {
    const response = await request(app)
      .post("/usuario")
      .set("x-access-token", token)
      .send(userData)
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: "error",
        message: "Dados de entrada inválidos.",
        details: expect.arrayContaining([expectedDetail]),
      }),
    );
    expect(response.body.requestId).toEqual(expect.any(String));
  });
});
