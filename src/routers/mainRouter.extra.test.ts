import express from 'express';
import request from 'supertest';

describe('mainRouter extra routes', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should delegate GET /categorias to categoriaController.buscarTodasCategorias', async () => {
    const buscarTodasCategorias = jest.fn(async (_req, res) => {
      res.status(200).json({ data: [{ id: 'cat-1', descricao: 'Alimentacao' }], meta: { total: 1 } });
    });

    jest.doMock('./middlewares/loginMiddleware', () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('../controllers/categoria/categoriaController', () => ({
      categoriaController: { buscarTodasCategorias, criarCategoria: jest.fn() },
    }));
    jest.doMock('./middlewares/usuarioMiddleware', () => ({
      validateUser: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('../controllers/usuario/usuarioController', () => ({
      usuarioControler: { criarUsuario: jest.fn(), login: jest.fn() },
    }));

    const { router } = await import('./mainrouter');
    const app = express();
    app.use(express.json());
    app.use(router);

    const response = await request(app).get('/categorias');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ id: 'cat-1', descricao: 'Alimentacao' }], meta: { total: 1 } });
    expect(buscarTodasCategorias).toHaveBeenCalledTimes(1);
  });

  it('should delegate POST /categorias to categoriaController.criarCategoria', async () => {
    const criarCategoria = jest.fn(async (req, res) => {
      res.status(201).json({ data: { id: 'cat-1', descricao: req.body.descricao } });
    });

    jest.doMock('./middlewares/loginMiddleware', () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('./middlewares/usuarioMiddleware', () => ({
      validateUser: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('../controllers/categoria/categoriaController', () => ({
      categoriaController: { buscarTodasCategorias: jest.fn(), criarCategoria },
    }));
    jest.doMock('../controllers/usuario/usuarioController', () => ({
      usuarioControler: { criarUsuario: jest.fn(), login: jest.fn() },
    }));

    const { router } = await import('./mainrouter');
    const app = express();
    app.use(express.json());
    app.use(router);

    const response = await request(app).post('/categorias').send({ descricao: 'Moradia' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { id: 'cat-1', descricao: 'Moradia' } });
    expect(criarCategoria).toHaveBeenCalledTimes(1);
  });

  it('should delegate POST /login to usuarioControler.login', async () => {
    const login = jest.fn(async (_req, res) => {
      res.status(200).json({ data: { accessToken: 'jwt-token', tokenType: 'Bearer', expiresIn: 3600 } });
    });

    jest.doMock('./middlewares/usuarioMiddleware', () => ({
      validateUser: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('../controllers/usuario/usuarioController', () => ({
      usuarioControler: { criarUsuario: jest.fn(), login },
    }));
    jest.doMock('./middlewares/loginMiddleware', () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('../controllers/categoria/categoriaController', () => ({
      categoriaController: { buscarTodasCategorias: jest.fn(), criarCategoria: jest.fn() },
    }));

    const { router } = await import('./mainrouter');
    const app = express();
    app.use(express.json());
    app.use(router);

    const response = await request(app).post('/login').send({ email: 'joao@example.com', senha: '123456' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { accessToken: 'jwt-token', tokenType: 'Bearer', expiresIn: 3600 } });
    expect(login).toHaveBeenCalledTimes(1);
  });
});
