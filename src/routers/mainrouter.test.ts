import request from 'supertest';
import { app } from '../app';
import authorization from '../secure/authorization';

describe('GET /health', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      message: "API 'NossoSaldo' está funcionando corretamente"
    });
  });

  it('should return JSON content type', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['content-type']).toMatch(/json/);
  });
});

describe('POST /usuario', () => {
  let token: string;

  beforeAll(async () => {
    const signedToken = await authorization.sign('test-user-id');

    if (!signedToken) {
      throw new Error('Falha ao gerar token para os testes de /usuario');
    }

    token = signedToken;
  });

  it('should return 400 when nome is missing', async () => {
    const userData = {
      email: 'joao@example.com',
      senha: 'senha123'
    };

    const response = await request(app)
      .post('/usuario')
      .set('x-access-token', token)
      .send(userData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('should return 400 when email is invalid', async () => {
    const userData = {
      nome: 'João Silva',
      email: 'email-invalido',
      senha: 'senha123'
    };

    const response = await request(app)
      .post('/usuario')
      .set('x-access-token', token)
      .send(userData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('should return 400 when email is missing', async () => {
    const userData = {
      nome: 'João Silva',
      senha: 'senha123'
    };

    const response = await request(app)
      .post('/usuario')
      .set('x-access-token', token)
      .send(userData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('should return 400 when senha is less than 6 characters', async () => {
    const userData = {
      nome: 'João Silva',
      email: 'joao@example.com',
      senha: '123'
    };

    const response = await request(app)
      .post('/usuario')
      .set('x-access-token', token)
      .send(userData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('should return 400 when senha is missing', async () => {
    const userData = {
      nome: 'João Silva',
      email: 'joao@example.com'
    };

    const response = await request(app)
      .post('/usuario')
      .set('x-access-token', token)
      .send(userData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });
});
