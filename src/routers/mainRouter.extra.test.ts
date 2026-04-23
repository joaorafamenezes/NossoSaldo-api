import express from 'express';
import request from 'supertest';

describe('mainRouter extra routes', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should delegate GET /categorias to categoriaController.buscarTodasCategorias', async () => {
    const buscarTodasCategorias = jest.fn(async (_req, res) => {
      res.status(200).json([{ id: 'cat-1', descricao: 'Alimentacao' }]);
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
    jest.doMock('../controllers/usuarioController', () => ({
      usuarioControler: { criarUsuario: jest.fn(), login: jest.fn() },
    }));

    const { router } = await import('./mainRouter');
    const app = express();
    app.use(express.json());
    app.use(router);

    const response = await request(app).get('/categorias');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 'cat-1', descricao: 'Alimentacao' }]);
    expect(buscarTodasCategorias).toHaveBeenCalledTimes(1);
  });

  it('should delegate POST /categoria to categoriaController.criarCategoria', async () => {
    const criarCategoria = jest.fn(async (req, res) => {
      res.status(201).json({ id: 'cat-1', descricao: req.body.descricao });
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
    jest.doMock('../controllers/usuarioController', () => ({
      usuarioControler: { criarUsuario: jest.fn(), login: jest.fn() },
    }));

    const { router } = await import('./mainRouter');
    const app = express();
    app.use(express.json());
    app.use(router);

    const response = await request(app).post('/categoria').send({ descricao: 'Moradia' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 'cat-1', descricao: 'Moradia' });
    expect(criarCategoria).toHaveBeenCalledTimes(1);
  });

  it('should delegate POST /login to usuarioControler.login', async () => {
    const login = jest.fn(async (_req, res) => {
      res.status(200).json({ auth: true, token: 'jwt-token' });
    });

    jest.doMock('./middlewares/usuarioMiddleware', () => ({
      validateUser: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('../controllers/usuarioController', () => ({
      usuarioControler: { criarUsuario: jest.fn(), login },
    }));
    jest.doMock('./middlewares/loginMiddleware', () => ({
      __esModule: true,
      default: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    }));
    jest.doMock('../controllers/categoria/categoriaController', () => ({
      categoriaController: { buscarTodasCategorias: jest.fn(), criarCategoria: jest.fn() },
    }));

    const { router } = await import('./mainRouter');
    const app = express();
    app.use(express.json());
    app.use(router);

    const response = await request(app).post('/login').send({ email: 'joao@example.com', senha: '123456' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ auth: true, token: 'jwt-token' });
    expect(login).toHaveBeenCalledTimes(1);
  });
});
