import authorization from './authorization';

describe('authorization', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should sign and verify token successfully', async () => {
    const token = await authorization.sign('user-test-id');

    expect(token).toBeTruthy();

    const payload = await authorization.verifyToken(token as string);

    expect(payload).toEqual({ id: 'user-test-id' });
  });

  it('should return null for invalid token', async () => {
    const payload = await authorization.verifyToken('token-invalido');

    expect(payload).toBeNull();
  });

  it('should return null when token signature is tampered', async () => {
    const token = await authorization.sign('user-test-id');
    const tamperedToken = `${token}a`;

    const payload = await authorization.verifyToken(tamperedToken);

    expect(payload).toBeNull();
  });
});
