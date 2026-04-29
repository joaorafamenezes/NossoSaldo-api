import express from "express";
import request from "supertest";

describe("usuarioRouter", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function setupMocks(overrides: Record<string, jest.Mock> = {}) {
    jest.doMock("../middlewares/loginMiddleware", () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock("../middlewares/usuarioMiddleware", () => ({
      validateUser: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock("../../controllers/usuario/usuarioController", () => ({
      usuarioControler: {
        listarUsuarios: jest.fn(),
        listarUsuarioPorId: jest.fn(),
        criarUsuario: jest.fn(),
        login: jest.fn(),
        atualizaUsuario: jest.fn(),
        atualizaSenhaUsuario: jest.fn(),
        ...overrides,
      },
    }));
  }

  it("should delegate GET /usuarios to usuarioControler.listarUsuarios", async () => {
    const listarUsuarios = jest.fn(async (_req, res) => {
      res.status(200).json([{ id: "1", nome: "Joao" }]);
    });

    setupMocks({ listarUsuarios });

    const { usuarioRouter } = await import("./usuarioRouter");
    const app = express();
    app.use(express.json());
    app.use(usuarioRouter);

    const response = await request(app).get("/usuarios");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: "1", nome: "Joao" }]);
    expect(listarUsuarios).toHaveBeenCalledTimes(1);
  });

  it("should delegate GET /usuarios/listarUsuarioPorId to usuarioControler.listarUsuarioPorId", async () => {
    const listarUsuarioPorId = jest.fn(async (_req, res) => {
      res.status(200).json({ id: "1", nome: "Joao" });
    });

    setupMocks({ listarUsuarioPorId });

    const { usuarioRouter } = await import("./usuarioRouter");
    const app = express();
    app.use(express.json());
    app.use(usuarioRouter);

    const response = await request(app).get("/usuarios/listarUsuarioPorId");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "1", nome: "Joao" });
    expect(listarUsuarioPorId).toHaveBeenCalledTimes(1);
  });

  it("should delegate POST /usuarios to usuarioControler.criarUsuario", async () => {
    const criarUsuario = jest.fn(async (req, res) => {
      res.status(201).json({ id: "1", ...req.body });
    });

    setupMocks({ criarUsuario });

    const { usuarioRouter } = await import("./usuarioRouter");
    const app = express();
    app.use(express.json());
    app.use(usuarioRouter);

    const response = await request(app)
      .post("/usuarios")
      .send({ nome: "Joao", email: "joao@example.com", senha: "123456" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: "1", nome: "Joao", email: "joao@example.com", senha: "123456" });
    expect(criarUsuario).toHaveBeenCalledTimes(1);
  });

  it("should delegate POST /login to usuarioControler.login", async () => {
    const login = jest.fn(async (_req, res) => {
      res.status(200).json({ auth: true, token: "jwt-token" });
    });

    setupMocks({ login });

    const { usuarioRouter } = await import("./usuarioRouter");
    const app = express();
    app.use(express.json());
    app.use(usuarioRouter);

    const response = await request(app)
      .post("/login")
      .send({ email: "joao@example.com", senha: "123456" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ auth: true, token: "jwt-token" });
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("should delegate PATCH /usuarios to usuarioControler.atualizaUsuario", async () => {
    const atualizaUsuario = jest.fn(async (req, res) => {
      res.status(200).json({ id: "1", ...req.body });
    });

    setupMocks({ atualizaUsuario });

    const { usuarioRouter } = await import("./usuarioRouter");
    const app = express();
    app.use(express.json());
    app.use(usuarioRouter);

    const response = await request(app)
      .patch("/usuarios")
      .send({ nome: "Joao Atualizado", email: "joao@example.com" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "1", nome: "Joao Atualizado", email: "joao@example.com" });
    expect(atualizaUsuario).toHaveBeenCalledTimes(1);
  });

  it("should delegate PATCH /usuarios/atualizaSenha to usuarioControler.atualizaSenhaUsuario", async () => {
    const atualizaSenhaUsuario = jest.fn(async (_req, res) => {
      res.status(200).json({ message: "Senha atualizada com sucesso" });
    });

    setupMocks({ atualizaSenhaUsuario });

    const { usuarioRouter } = await import("./usuarioRouter");
    const app = express();
    app.use(express.json());
    app.use(usuarioRouter);

    const response = await request(app)
      .patch("/usuarios/atualizaSenha")
      .send({ senha: "novaSenha123" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Senha atualizada com sucesso" });
    expect(atualizaSenhaUsuario).toHaveBeenCalledTimes(1);
  });
});
