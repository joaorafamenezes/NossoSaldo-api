import autentication from './autentication';

describe('autentication', () => {
  it('should hash password with different output than plain text', () => {
    const plainPassword = 'senha-super-segura';

    const hashed = autentication.hasPassword(plainPassword);

    expect(hashed).toBeTruthy();
    expect(hashed).not.toBe(plainPassword);
  });

  it('should validate correct password against hash', () => {
    const plainPassword = 'senha-super-segura';
    const hashed = autentication.hasPassword(plainPassword);

    const result = autentication.checkPassword(plainPassword, hashed);

    expect(result).toBe(true);
  });

  it('should reject incorrect password against hash', () => {
    const hashed = autentication.hasPassword('senha-certa');

    const result = autentication.checkPassword('senha-errada', hashed);

    expect(result).toBe(false);
  });
});
